"""
Prompt Generation Engine

Generates three prompt engineering variants for any given task:
1. Basic Prompting: Simple, direct instruction without advanced structure or examples.
2. Structured Prompting: Multi-part prompt with explicit Role, Objective, Context,
   Step-by-step instructions, Constraints, Expected output format, and Quality requirements.
3. Example-Based Prompting (Few-Shot): Demonstrates target format and reasoning with
   category-appropriate input-output exemplars without leaking the actual test case.

All three variants receive the identical original task input and constraints.
"""

from typing import Dict, Any, List

# Category-specific few-shot examples that DO NOT leak test case answers
FEW_SHOT_EXAMPLES: Dict[str, List[Dict[str, str]]] = {
    "Text Summarization": [
        {
            "input": "Photosynthesis is the process used by plants, algae, and certain bacteria to convert light energy into chemical energy, primarily storing it in carbohydrate molecules like sugars synthesized from carbon dioxide and water.",
            "output": "Photosynthesis converts light, water, and carbon dioxide into chemical energy stored in plant sugars."
        },
        {
            "input": "The water cycle describes the continuous movement of water on, above, and below the surface of the Earth, driven by solar energy through evaporation, condensation, precipitation, and runoff.",
            "output": "The water cycle is the continuous solar-driven movement of Earth's water through evaporation, precipitation, and runoff."
        }
    ],
    "Content Generation": [
        {
            "input": "Write a short paragraph explaining why hydration is important for athletes.",
            "output": "Hydration is essential for athletic performance because water regulates body temperature, lubricates joints, and transports vital nutrients throughout the bloodstream. Even mild dehydration can lead to premature fatigue, muscle cramps, and reduced cognitive focus during strenuous exercise. Maintaining optimal fluid and electrolyte balance before, during, and after physical exertion ensures sustained endurance and promotes faster muscular recovery."
        }
    ],
    "Question Answering": [
        {
            "input": "What is the difference between speed and velocity?",
            "output": "Speed is a scalar quantity measuring how fast an object moves regardless of direction (e.g., 50 km/h). Velocity is a vector quantity that specifies both the rate of motion and its specific direction (e.g., 50 km/h due North)."
        },
        {
            "input": "What is the difference between aerobic and anaerobic exercise?",
            "output": "Aerobic exercise involves continuous, moderate-intensity activity fueled by oxygen (like jogging or cycling). Anaerobic exercise involves short bursts of high-intensity activity where energy demands exceed available oxygen (like sprinting or heavy weightlifting)."
        }
    ],
    "Classification": [
        {
            "input": "The flight was delayed four hours with zero explanation from the gate agent.",
            "output": "Category: Negative Sentiment\nConfidence: High\nReason: Customer expresses frustration with long delay and poor communication."
        },
        {
            "input": "Order arrived two days ahead of schedule, neatly packaged and in perfect condition.",
            "output": "Category: Positive Sentiment\nConfidence: High\nReason: Customer highlights early delivery and intact packaging."
        }
    ],
    "Data Extraction": [
        {
            "input": "Dr. Sarah Chen, 34, joined our Seattle clinic as Chief of Neurology. Inquiries can be directed to sarah.chen@medcenter.org.",
            "output": "- Name: Dr. Sarah Chen\n- Age: 34\n- City: Seattle\n- Role: Chief of Neurology\n- Email: sarah.chen@medcenter.org"
        },
        {
            "input": "Applicant Marcus Vance (age 28) from Austin completed Mechanical Engineering. Contact: marcus.v@autotech.io.",
            "output": "- Name: Marcus Vance\n- Age: 28\n- City: Austin\n- Course/Field: Mechanical Engineering\n- Email: marcus.v@autotech.io"
        }
    ],
    "Logical Reasoning": [
        {
            "input": "Premise: All mammals have backbones. All whales are mammals. Conclusion: Do whales have backbones?",
            "output": "Analysis: By transitive deduction, since whales belong to the set of mammals, and all members of that set possess backbones, whales must possess backbones.\nConclusion: Yes, whales have backbones."
        }
    ],
    "General Tasks": [
        {
            "input": "List three effective tips for time management.",
            "output": "1. Prioritize tasks using the Eisenhower Matrix to separate urgent from important.\n2. Use time-blocking techniques to protect focused, distraction-free work intervals.\n3. Regularly review progress at the end of each day to adjust subsequent schedules."
        }
    ]
}

CATEGORY_ROLES: Dict[str, Dict[str, str]] = {
    "Text Summarization": {
        "role": "Expert Technical and Editorial Summarizer",
        "objective": "Distill the provided input text into a clear, faithful, and concise summary that retains core facts.",
        "quality": "Maintain 100% factual fidelity; eliminate redundancy; do not invent details."
    },
    "Content Generation": {
        "role": "Professional Content Strategist and Copywriter",
        "objective": "Produce well-structured, engaging, and purposeful prose tailored strictly to the prompt.",
        "quality": "Cohesive flow, compelling topic sentences, active voice, and clear relevance to the intended audience."
    },
    "Question Answering": {
        "role": "Authoritative Subject Matter Domain Expert",
        "objective": "Provide an accurate, precise, and educational answer addressing the exact query.",
        "quality": "Direct answer upfront, factual correctness, clear distinctions, and zero hallucinated claims."
    },
    "Classification": {
        "role": "Precision Data Classifier and Taxonomist",
        "objective": "Categorize the provided text into the most appropriate class with brief justification.",
        "quality": "Strict label adherence, unambiguous categorization, and objective reasoning."
    },
    "Data Extraction": {
        "role": "Systematic Information Extraction Specialist",
        "objective": "Extract specific factual attributes from unstructured text into clearly labeled key-value pairs.",
        "quality": "Strict schema adherence, exact verbatim extraction, and explicit omission when data is absent."
    },
    "Logical Reasoning": {
        "role": "Formal Logic and Analytical Reasoning Evaluator",
        "objective": "Break down premises, verify deductive or inductive validity, and present a sound conclusion.",
        "quality": "Step-by-step justification, avoidance of logical fallacies, and explicit final conclusion."
    },
    "General Tasks": {
        "role": "Versatile AI Assistant and Solutions Analyst",
        "objective": "Execute the requested instructions thoroughly, accurately, and cleanly.",
        "quality": "High precision, crisp organization, and faithful instruction following."
    }
}

class PromptGenerator:
    """Generates Basic, Structured, and Example-Based prompts."""

    @staticmethod
    def generate_basic_prompt(
        task_category: str,
        original_input: str,
        additional_instructions: str = ""
    ) -> str:
        """
        Version 1: Basic Prompt
        Direct, straightforward command without detailed structuring or few-shot exemplars.
        """
        extra = f" Note: {additional_instructions.strip()}" if additional_instructions and additional_instructions.strip() else ""

        if task_category == "Text Summarization":
            return f"Summarize the following passage clearly and concisely:{extra}\n\n{original_input}"
        elif task_category == "Content Generation":
            return f"Generate content according to this prompt:{extra}\n\n{original_input}"
        elif task_category == "Question Answering":
            return f"Answer the following question accurately:{extra}\n\n{original_input}"
        elif task_category == "Classification":
            return f"Classify the following text:{extra}\n\n{original_input}"
        elif task_category == "Data Extraction":
            return f"Extract all relevant key entities and structured fields from the following text:{extra}\n\n{original_input}"
        elif task_category == "Logical Reasoning":
            return f"Solve and answer the following logical problem step by step:{extra}\n\n{original_input}"
        else:
            return f"Perform the following task:{extra}\n\n{original_input}"

    @staticmethod
    def generate_structured_prompt(
        task_category: str,
        original_input: str,
        expected_output: str,
        additional_instructions: str = ""
    ) -> str:
        """
        Version 2: Structured Prompt
        Decomposed instruction with explicit Role, Objective, Context, Step-by-Step
        Instructions, Constraints, Expected Output Format, and Quality Requirements.
        """
        meta = CATEGORY_ROLES.get(task_category, CATEGORY_ROLES["General Tasks"])
        role = meta["role"]
        objective = meta["objective"]
        quality = meta["quality"]

        instructions_list = [
            "1. Read the input thoroughly to identify the primary entities, facts, or instructions.",
            "2. Address every explicit constraint or question posed in the input.",
            "3. Filter out irrelevant details while preserving all critical information.",
            "4. Formulate the response directly matching the requested structure.",
            "5. Review the final response against the constraints before concluding."
        ]
        instructions_text = "\n".join(instructions_list)

        constraints = [
            "- Maintain strict factual fidelity to the provided input.",
            "- Do not extrapolate, assume, or hallucinate unsupported claims.",
            "- Adhere strictly to tone, length, and formatting expectations."
        ]
        if additional_instructions and additional_instructions.strip():
            constraints.append(f"- Additional constraint: {additional_instructions.strip()}")
        constraints_text = "\n".join(constraints)

        return (
            f"You are a {role}.\n\n"
            f"### Objective:\n"
            f"{objective}\n\n"
            f"### Context:\n"
            f"This task belongs to the '{task_category}' domain. The output must satisfy rigorous academic and technical evaluation standards.\n\n"
            f"### Step-by-Step Instructions:\n"
            f"{instructions_text}\n\n"
            f"### Constraints:\n"
            f"{constraints_text}\n\n"
            f"### Expected Output Format:\n"
            f"{expected_output}\n\n"
            f"### Quality Requirements:\n"
            f"{quality}\n\n"
            f"### Input:\n"
            f"{original_input}\n\n"
            f"Provide your final, structured response below:"
        )

    @staticmethod
    def generate_example_based_prompt(
        task_category: str,
        original_input: str,
        additional_instructions: str = ""
    ) -> str:
        """
        Version 3: Example-Based Prompt (Few-Shot Prompting)
        Contains role, objective, category-relevant exemplar pairs that illustrate
        the desired pattern, followed by the target input and execution directive.
        """
        meta = CATEGORY_ROLES.get(task_category, CATEGORY_ROLES["General Tasks"])
        role = meta["role"]
        objective = meta["objective"]

        examples = FEW_SHOT_EXAMPLES.get(task_category, FEW_SHOT_EXAMPLES["General Tasks"])
        examples_text = ""
        for i, eg in enumerate(examples, 1):
            examples_text += (
                f"--- Example {i} ---\n"
                f"Input:\n{eg['input']}\n\n"
                f"Output:\n{eg['output']}\n\n"
            )

        extra = f"\nAdditional constraint: {additional_instructions.strip()}" if additional_instructions and additional_instructions.strip() else ""

        return (
            f"You are a {role}.\n"
            f"Objective: {objective}\n\n"
            f"Study the following demonstrated example(s) to understand the expected formatting, tone, and depth:\n\n"
            f"{examples_text}"
            f"--- Target Task ---\n"
            f"Now perform the same operation for the following target input.{extra}\n"
            f"Follow the demonstrated style, preserve exact meaning, and avoid unsupported claims.\n\n"
            f"Input:\n{original_input}\n\n"
            f"Output:"
        )

    @classmethod
    def generate_all(
        cls,
        task_category: str,
        original_input: str,
        expected_output: str,
        additional_instructions: str = ""
    ) -> Dict[str, str]:
        """Generates all 3 prompt variants."""
        return {
            "Basic": cls.generate_basic_prompt(task_category, original_input, additional_instructions),
            "Structured": cls.generate_structured_prompt(task_category, original_input, expected_output, additional_instructions),
            "Example-Based": cls.generate_example_based_prompt(task_category, original_input, additional_instructions),
        }

