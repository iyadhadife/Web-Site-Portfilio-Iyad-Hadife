# AI Agent for Standards Compliance (Agent-to-Agent)

**Context:** final-year internship at Dassault Systèmes, Transportation & Mobility Innovation Lab (about six weeks, at the end of the internship)
**Role:** building an orchestrator, led by two supervisors and supported by the Innovation Lab team in Japan

## Goal

Show an industrial partner that an AI agent can check technical reports (stored in Dassault Systèmes software) against the customer's standards (stored in the customer's own databases) and flag missing items. The strategic goal was also to prove that Dassault Systèmes masters **Agent-to-Agent (A2A)** architectures and can make its agents work with a customer's agents.

## How the project evolved

- **Start:** a single agent calling our tools through **MCP** (Model Context Protocol) servers.
- **Mid-project pivot:** move to an **A2A** architecture, with an orchestrator notionally sitting on the customer side. It calls its own tools (simulated by mock "customer" MCP servers) and our agents, which keep their native tools.

## What I did

- Started from a project template shared by the Japanese team, then adapted it to the use case.
- Structured the agent with the internal declarative architecture: an *app manager* exposes the API, *factories* instantiate agents and tools from a registry, and *schemas* validate inputs and outputs.
- Built an orchestrator, an MCP server and an OCR tool for PDFs.
- Prepared slides for progress reviews.

## Outcome (honestly)

Results are **mixed**: the timeline was short, the strategy changed mid-project, access to internal agents and LLMs came late and the internal libraries were poorly documented.

- **Delivered:** an orchestrator template connected to the internal LLMs.
- **Not done during the internship:** the A2A connection to a customer's agents (no contract was signed at the time) and deployment to the Sandbox environment.

## Technologies

Python, LangChain, LangGraph, FastAPI, MCP, Agent-to-Agent, Mistral Medium, Git

> Internal, confidential project: the code is not published.
