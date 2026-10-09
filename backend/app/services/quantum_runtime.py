import time
import logging
import numpy as np
from typing import Dict, Any, Optional, Tuple
import qiskit
import qiskit_aer
import qiskit_machine_learning
import qiskit_ibm_runtime
from qiskit import QuantumCircuit
from qiskit.circuit.library import zz_feature_map, ZZFeatureMap
from qiskit_aer import AerSimulator

from app.config import settings
from app.schemas.models import (
    QuantumStatusResponse,
    QuantumRunRequest,
    QuantumRunResponse,
    JobStatusResponse,
)

logger = logging.getLogger("trustrate.quantum_runtime")


class QuantumRuntimeService:
    """
    Manages local Qiskit Aer simulation and optional physical IBM Quantum hardware execution.
    Maintains rigorous transparency: Never conflates simulation with physical hardware runs.
    """

    @classmethod
    def get_status(cls) -> QuantumStatusResponse:
        """
        Inspects available quantum software packages and runtime connection status.
        Never reveals secret API tokens.
        """
        has_token = settings.is_hardware_configured()
        hw_verified = False
        message = ""
        configured_backend = settings.IBM_BACKEND_NAME or None

        if has_token:
            # Check connectivity with IBM Quantum Platform
            try:
                from qiskit_ibm_runtime import QiskitRuntimeService as IBMService
                channel = "ibm_quantum_platform"
                kwargs = {"channel": channel, "token": settings.IBM_QUANTUM_TOKEN}
                if settings.IBM_INSTANCE:
                    kwargs["instance"] = settings.IBM_INSTANCE

                service = IBMService(**kwargs)
                backends = service.backends()
                hw_verified = True
                message = f"Connected to IBM Quantum platform. {len(backends)} backends accessible."
            except Exception as e:
                hw_verified = False
                clean_err = str(e).split("\n")[0]
                message = f"IBM Quantum credentials configured, but verification failed: {clean_err}"
        else:
            message = "Local Qiskit Aer simulator active. IBM Quantum token not configured (optional)."

        return QuantumStatusResponse(
            qiskit_available=True,
            qiskit_version=qiskit.__version__,
            qiskit_machine_learning_available=True,
            qiskit_machine_learning_version=qiskit_machine_learning.__version__,
            aer_available=True,
            aer_version=qiskit_aer.__version__,
            ibm_runtime_available=True,
            ibm_runtime_version=qiskit_ibm_runtime.__version__,
            current_execution_mode=settings.QUANTUM_MODE,
            hardware_configured=has_token,
            hardware_connectivity_verified=hw_verified,
            configured_backend=configured_backend,
            message=message,
        )

    @classmethod
    def build_feature_circuit(
        cls, n_qubits: int = 2, input_values: Optional[list] = None
    ) -> QuantumCircuit:
        """
        Constructs and binds a parameterized ZZFeatureMap circuit with measurement operators.
        """
        try:
            fm = zz_feature_map(feature_dimension=n_qubits, reps=1, entanglement="linear")
        except Exception:
            fm = ZZFeatureMap(feature_dimension=n_qubits, reps=1, entanglement="linear")

        if not input_values or len(input_values) < n_qubits:
            input_values = [0.3 * np.pi * (i + 1) for i in range(n_qubits)]

        param_dict = {p: float(val) for p, val in zip(fm.parameters, input_values[:n_qubits])}
        bound = fm.assign_parameters(param_dict)
        bound.measure_all()
        return bound

    @classmethod
    def execute_circuit(cls, req: QuantumRunRequest) -> QuantumRunResponse:
        """
        Executes circuit on either local Aer simulator or physical IBM Quantum hardware.
        """
        requested_mode = req.mode.lower()
        t0 = time.perf_counter()

        # Build genuine parameterized Qiskit circuit
        qc = cls.build_feature_circuit(n_qubits=req.n_qubits, input_values=req.input_values)
        circuit_diagram = str(qc.draw("text"))

        if requested_mode == "aer":
            try:
                simulator = AerSimulator()
                result = simulator.run(qc, shots=req.shots).result()
                counts = result.get_counts()
                elapsed_ms = (time.perf_counter() - t0) * 1000.0

                return QuantumRunResponse(
                    status="completed",
                    mode="aer",
                    backend_name="aer_simulator",
                    job_id=None,  # Explicitly None: Local simulation, not a cloud job
                    qubit_count=qc.num_qubits,
                    circuit_depth=qc.depth(),
                    counts=counts,
                    execution_time_ms=round(elapsed_ms, 2),
                    hardware_notice="Executed locally using Qiskit Aer state simulator. No cloud hardware was utilized.",
                    circuit_diagram=circuit_diagram,
                )
            except Exception as e:
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                return QuantumRunResponse(
                    status="failed",
                    mode="aer",
                    backend_name="aer_simulator",
                    job_id=None,
                    qubit_count=qc.num_qubits,
                    circuit_depth=qc.depth(),
                    counts={},
                    execution_time_ms=round(elapsed_ms, 2),
                    hardware_notice="Aer simulation encountered an error.",
                    circuit_diagram=circuit_diagram,
                    error=str(e),
                )

        elif requested_mode == "ibm_hardware":
            if not settings.is_hardware_configured():
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                return QuantumRunResponse(
                    status="failed",
                    mode="ibm_hardware",
                    backend_name="unconfigured",
                    job_id=None,
                    qubit_count=qc.num_qubits,
                    circuit_depth=qc.depth(),
                    counts={},
                    execution_time_ms=round(elapsed_ms, 2),
                    hardware_notice="Hardware execution aborted: IBM_QUANTUM_TOKEN is missing. Please configure token in .env.",
                    circuit_diagram=circuit_diagram,
                    error="IBM_QUANTUM_TOKEN environment variable not set. Hardware execution refused.",
                )

            try:
                from qiskit_ibm_runtime import QiskitRuntimeService as IBMService, SamplerV2
                from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

                channel = "ibm_quantum_platform"
                init_args = {"channel": channel, "token": settings.IBM_QUANTUM_TOKEN}
                if settings.IBM_INSTANCE:
                    init_args["instance"] = settings.IBM_INSTANCE

                service = IBMService(**init_args)

                # Select hardware backend
                if settings.IBM_BACKEND_NAME:
                    target_backend = service.backend(settings.IBM_BACKEND_NAME)
                else:
                    target_backend = service.least_busy(operational=True, simulator=False)

                backend_name = target_backend.name

                # Transpile for target ISA
                pm = generate_preset_pass_manager(optimization_level=1, backend=target_backend)
                isa_circuit = pm.run(qc)

                # Submit job via SamplerV2 primitive
                sampler = SamplerV2(mode=target_backend)
                job = sampler.run([isa_circuit], shots=req.shots)
                job_id = job.job_id()

                elapsed_ms = (time.perf_counter() - t0) * 1000.0

                return QuantumRunResponse(
                    status="submitted",
                    mode="ibm_hardware",
                    backend_name=backend_name,
                    job_id=job_id,
                    qubit_count=qc.num_qubits,
                    circuit_depth=isa_circuit.depth(),
                    counts={},
                    execution_time_ms=round(elapsed_ms, 2),
                    hardware_notice=(
                        f"Demonstration circuit submitted to physical IBM Quantum processor '{backend_name}' "
                        f"via Qiskit Runtime SamplerV2. Job ID: {job_id}."
                    ),
                    circuit_diagram=circuit_diagram,
                )
            except Exception as e:
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                return QuantumRunResponse(
                    status="failed",
                    mode="ibm_hardware",
                    backend_name=settings.IBM_BACKEND_NAME or "unknown",
                    job_id=None,
                    qubit_count=qc.num_qubits,
                    circuit_depth=qc.depth(),
                    counts={},
                    execution_time_ms=round(elapsed_ms, 2),
                    hardware_notice="Failed to connect or submit job to IBM Quantum hardware.",
                    circuit_diagram=circuit_diagram,
                    error=str(e),
                )
        else:
            return QuantumRunResponse(
                status="failed",
                mode=requested_mode,
                backend_name="unknown",
                qubit_count=qc.num_qubits,
                circuit_depth=qc.depth(),
                counts={},
                execution_time_ms=0.0,
                hardware_notice=f"Unsupported execution mode '{requested_mode}'. Supported modes are 'aer' and 'ibm_hardware'.",
                circuit_diagram=circuit_diagram,
                error=f"Invalid mode: {requested_mode}",
            )

    @classmethod
    def retrieve_job_status(cls, job_id: str) -> JobStatusResponse:
        """
        Queries status of an IBM Quantum hardware job using QiskitRuntimeService.
        """
        if not settings.is_hardware_configured():
            return JobStatusResponse(
                job_id=job_id,
                status="ERROR",
                execution_mode="ibm_hardware",
                error="IBM Quantum token not configured. Cannot query cloud job status.",
            )

        try:
            from qiskit_ibm_runtime import QiskitRuntimeService as IBMService
            channel = "ibm_quantum_platform"
            init_args = {"channel": channel, "token": settings.IBM_QUANTUM_TOKEN}
            if settings.IBM_INSTANCE:
                init_args["instance"] = settings.IBM_INSTANCE

            service = IBMService(**init_args)
            job = service.job(job_id)
            status_str = str(job.status())
            backend_name = job.backend().name if hasattr(job, "backend") and job.backend() else None
            creation_date = str(job.creation_date) if hasattr(job, "creation_date") else None

            result_data = None
            if status_str in ("DONE", "COMPLETED", "JobStatus.DONE"):
                try:
                    res = job.result()
                    # Extract counts if available
                    pub_res = res[0] if hasattr(res, "__getitem__") else res
                    if hasattr(pub_res, "data") and hasattr(pub_res.data, "meas"):
                        counts = pub_res.data.meas.get_counts()
                        result_data = {"counts": counts}
                except Exception:
                    result_data = {"info": "Job finished successfully"}

            return JobStatusResponse(
                job_id=job_id,
                status=status_str,
                backend=backend_name,
                creation_date=creation_date,
                execution_mode="ibm_hardware",
                result=result_data,
            )
        except Exception as e:
            return JobStatusResponse(
                job_id=job_id,
                status="ERROR",
                execution_mode="ibm_hardware",
                error=str(e),
            )
