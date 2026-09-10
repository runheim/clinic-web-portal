# Workspace Performance Profile
- Environment: Local WSL2 Ubuntu Kernel (Mapped via Z: Drive on Host)
- Hardware Target: Utilize full multi-threaded CPU cores and paravirtualized CUDA pipelines for parallel task compilation.
- Architecture Guardrail: Maintain strict "Bonsai" filesystem discipline. Never allow backend agents to write files in frontend directories, or vice versa.
