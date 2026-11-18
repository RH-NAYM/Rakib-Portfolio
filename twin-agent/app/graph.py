"""LangGraph wiring (phase 1a, full-context baseline per eng D7).

  START → guard ─┬─ handoff ───────────────────────────────► END
                 ├─ steer ─────────────────────────────────► END
                 ├─ smalltalk ─────────────────────────────► END
                 └─ plan → draft → critic ─┬─ respond ─────► END
                                ▲          └─ revise ─┐
                                └──────────────────────┘   (≤2 revisions, 15s cap)
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app import nodes as N


def build_graph(deps: N.Deps):
    g = StateGraph(N.State)
    g.add_node("guard", N.make_guard(deps))
    g.add_node("handoff", N.make_template(deps, "handoff", "contact"))
    g.add_node("steer", N.make_template(deps, "off_topic", None))
    g.add_node("smalltalk", N.make_template(deps, "smalltalk", None))
    g.add_node("plan", N.make_plan(deps))
    g.add_node("draft", N.make_draft(deps))
    g.add_node("critic", N.make_critic(deps))
    g.add_node("revise", N.revise)
    g.add_node("respond", N.make_respond(deps))

    g.add_edge(START, "guard")
    g.add_conditional_edges("guard", N.route_after_guard, ["handoff", "steer", "smalltalk", "plan"])
    for t in ("handoff", "steer", "smalltalk"):
        g.add_edge(t, END)
    g.add_edge("plan", "draft")
    g.add_edge("draft", "critic")
    g.add_conditional_edges("critic", N.make_after_critic(deps), ["respond", "revise"])
    g.add_edge("revise", "draft")
    g.add_edge("respond", END)
    return g.compile()
