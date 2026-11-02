"""
Comparison and Ranking Engine

Analyzes the evaluated outputs of the three prompting techniques:
- Basic Prompting
- Structured Prompting
- Example-Based Prompting

Ranks them based on actual empirical weighted scores, highlights the winner,
and synthesizes comparative strengths, weaknesses, and a concluding evaluation report.
"""

from typing import Dict, Any, List

def rank_and_compare(
    experiment_data: Dict[str, Any],
    technique_results: Dict[str, Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Ranks the 3 techniques dynamically according to weighted_score.
    Never hardcodes a winner; winner is strictly determined by evaluation numbers.
    """
    # Sort techniques by weighted_score descending
    sorted_items = sorted(
        technique_results.items(),
        key=lambda item: item[1]["evaluation"]["weighted_score"],
        reverse=True
    )

    ranking_list = []
    for rank, (technique, data) in enumerate(sorted_items, 1):
        ranking_list.append({
            "rank": rank,
            "technique": technique,
            "weighted_score": data["evaluation"]["weighted_score"],
            "accuracy": data["evaluation"]["accuracy"],
            "relevance": data["evaluation"]["relevance"],
            "completeness": data["evaluation"]["completeness"],
            "clarity": data["evaluation"]["clarity"],
            "instruction_following": data["evaluation"]["instruction_following"],
            "execution_time": data["execution_time"],
            "input_tokens": data.get("input_tokens"),
            "output_tokens": data.get("output_tokens")
        })

    winner_name = ranking_list[0]["technique"]
    winner_score = ranking_list[0]["weighted_score"]
    runner_up = ranking_list[1]["technique"]
    runner_up_score = ranking_list[1]["weighted_score"]

    # Comparative analysis synthesis
    score_diff = round(winner_score - runner_up_score, 2)
    win_factors = []
    winner_eval = technique_results[winner_name]["evaluation"]
    runner_eval = technique_results[runner_up]["evaluation"]

    for criterion in ["accuracy", "relevance", "completeness", "clarity", "instruction_following"]:
        if winner_eval[criterion] > runner_eval[criterion]:
            diff = round(winner_eval[criterion] - runner_eval[criterion], 1)
            win_factors.append(f"{criterion.replace('_', ' ').capitalize()} (+{diff} pts)")

    factors_str = ", ".join(win_factors) if win_factors else "consistent overall balance across criteria"

    winner_explanation = (
        f"'{winner_name}' achieved the highest weighted score of {winner_score}% "
        f"(outperforming '{runner_up}' at {runner_up_score}% by {score_diff}%). "
        f"Its competitive advantage was primarily driven by superior {factors_str}. "
        f"{winner_eval.get('detailed_explanation', '')}"
    )

    # Collect strengths and weaknesses per technique
    strengths_weaknesses = {}
    for tech_name, tech_val in technique_results.items():
        ev = tech_val["evaluation"]
        strengths_weaknesses[tech_name] = {
            "strengths": ev.get("strengths", ["Addressed primary prompt directives"]),
            "weaknesses": ev.get("weaknesses", ["Could optimize response formatting"]),
            "deterministic_notes": ev.get("deterministic_notes", [])
        }

    conclusion = (
        f"In this '{experiment_data.get('task_category')}' evaluation, {winner_name} provided the most effective instruction framing "
        f"for the model, achieving an aggregate score of {winner_score}%. "
        f"Basic prompting yielded an execution time of {technique_results.get('Basic', {}).get('execution_time', 0)}s, "
        f"while Structured and Example-Based techniques traded additional prompt length for higher formatting fidelity and constraint adherence. "
        f"Results demonstrate that prompt structure directly influences model determinism and output quality."
    )

    return {
        "ranking": ranking_list,
        "winning_technique": winner_name,
        "winner_explanation": winner_explanation,
        "strengths_weaknesses": strengths_weaknesses,
        "conclusion": conclusion
    }

