# Agent Kit


### Access Modes
AgentKit supports three configurable modes that control what happens when a human-backed agent is identified:
Mode	Behavior
free	Human-backed agents always bypass payment.
free-trial	Human-backed agents bypass payment the first N times (default: 1). After that, normal payment is required.
discount	Human-backed agents get an N% discount (optionally, only for the first N times).
Usage counters are tracked per human per endpoint — so two agents backed by the same human share the same counter.
