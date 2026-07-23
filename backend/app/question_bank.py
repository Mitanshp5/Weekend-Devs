"""Expanded MCQ question bank for PRISM — 150 questions across Math, Science, English.

Each question has: id, concept_id, subject, difficulty, prompt, answer_type,
expected_answer, options (for MCQ), hint_ladder, feedback, and rubric.
"""

from __future__ import annotations
from typing import Any

def _mcq(qid: str, concept: str, subject: str, diff: float, prompt: str,
         options: list[str], answer: str, hints: list[str],
         feedback_correct: str, rubric_items: list[tuple[str, str]] | None = None) -> dict[str, Any]:
    """Helper to build an MCQ entry compactly."""
    fb = {"correct": feedback_correct}
    rb = []
    if rubric_items:
        for pat, tag in rubric_items:
            fb[tag] = f"Not quite — review the concept related to {tag.split('.')[-1].replace('_', ' ')}."
            rb.append({"pattern": pat, "error_tag": tag, "confidence": 0.9})

    # Derive richer solution steps from answer + hints
    letter_idx = ord(answer.upper()) - 65
    correct_text = options[letter_idx] if 0 <= letter_idx < len(options) else answer
    solution_steps = [
        f"The correct answer is {answer}) {correct_text}.",
    ]
    if hints:
        solution_steps.append(hints[-1])  # Add the most direct hint as reasoning

    return {
        "id": qid, "concept_id": concept, "subject": subject, "difficulty": diff,
        "prompt": prompt, "answer_type": "mcq", "expected_answer": answer,
        "options": options, "solution_steps": solution_steps,
        "hint_ladder": hints, "feedback": fb, "rubric": rb,
        "ncert_reference": _NCERT_REFS.get(concept),
    }


# NCERT Class 8 reference mapping per concept
_NCERT_REFS: dict[str, dict[str, str]] = {
    # Mathematics
    "math.rational_numbers": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 1: Rational Numbers", "page_range": "pp. 1–20"},
    "math.linear_equations": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 2: Linear Equations in One Variable", "page_range": "pp. 21–35"},
    "num.signed_operations": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 2: Linear Equations in One Variable", "page_range": "pp. 21–35"},
    "eq.inverse_operations": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 2: Linear Equations in One Variable", "page_range": "pp. 21–35"},
    "eq.multi_step": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 2: Linear Equations in One Variable", "page_range": "pp. 21–35"},
    "eq.word_translation": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 2: Linear Equations in One Variable", "page_range": "pp. 21–35"},
    "num.mul_div_fluency": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 2: Linear Equations in One Variable", "page_range": "pp. 21–35"},
    "math.quadrilaterals": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 3: Understanding Quadrilaterals", "page_range": "pp. 36–56"},
    "math.data_handling": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 5: Data Handling", "page_range": "pp. 69–96"},
    "math.squares_roots": {"book": "Mathematics — NCERT Class 8", "chapter": "Chapter 6: Squares and Square Roots", "page_range": "pp. 97–114"},
    # Science
    "sci.crop_production": {"book": "Science — NCERT Class 8", "chapter": "Chapter 1: Crop Production and Management", "page_range": "pp. 1–12"},
    "sci.microorganisms": {"book": "Science — NCERT Class 8", "chapter": "Chapter 2: Microorganisms: Friend and Foe", "page_range": "pp. 13–24"},
    "sci.coal_petroleum": {"book": "Science — NCERT Class 8", "chapter": "Chapter 5: Coal and Petroleum", "page_range": "pp. 47–54"},
    "sci.combustion_flame": {"book": "Science — NCERT Class 8", "chapter": "Chapter 6: Combustion and Flame", "page_range": "pp. 55–64"},
    "sci.conservation": {"book": "Science — NCERT Class 8", "chapter": "Chapter 7: Conservation of Plants and Animals", "page_range": "pp. 65–76"},
    # English
    "eng.christmas_present": {"book": "Honeydew — NCERT Class 8", "chapter": "Chapter 1: The Best Christmas Present in the World"},
    "eng.tsunami": {"book": "Honeydew — NCERT Class 8", "chapter": "Chapter 2: The Tsunami"},
    "eng.glimpses_past": {"book": "Honeydew — NCERT Class 8", "chapter": "Chapter 3: Glimpses of the Past"},
    "eng.bepin_choudhury": {"book": "Honeydew — NCERT Class 8", "chapter": "Chapter 4: Bepin Choudhury's Lapse of Memory"},
    "eng.summit_within": {"book": "Honeydew — NCERT Class 8", "chapter": "Chapter 5: The Summit Within"},
}

# ═══════════════════════════════════════════════════════════════════════════
# MATHEMATICS — 5 units × 10 MCQs = 50
# ═══════════════════════════════════════════════════════════════════════════

MATH_QUESTIONS: list[dict[str, Any]] = [
    # ── Unit 1: Rational Numbers ──
    _mcq("m.rn.01","math.rational_numbers","mathematics",0.25,"Which of these is a rational number?",["√2","3/4","π","√5"],"B",["A rational number can be written as p/q.","Which option is a fraction?","3/4 is already in p/q form."],"Correct! 3/4 is a rational number because it's p/q where q≠0."),
    _mcq("m.rn.02","math.rational_numbers","mathematics",0.30,"What is −2/3 + 1/3?",["−1/3","1/3","−1","0"],"A",["Add the numerators since denominators are the same.","−2 + 1 = ?","−1/3 is the result."],"Correct! (−2+1)/3 = −1/3."),
    _mcq("m.rn.03","math.rational_numbers","mathematics",0.35,"The additive inverse of −5/7 is:",["−5/7","5/7","7/5","−7/5"],"B",["The additive inverse of a number gives 0 when added.","What + (−5/7) = 0?","5/7 is the additive inverse."],"Correct! 5/7 + (−5/7) = 0."),
    _mcq("m.rn.04","math.rational_numbers","mathematics",0.30,"Which property states a+b = b+a for rationals?",["Associative","Commutative","Distributive","Identity"],"B",["Which property is about order of addition?","Changing order doesn't change the result.","This is the commutative property."],"Correct! The commutative property."),
    _mcq("m.rn.05","math.rational_numbers","mathematics",0.40,"What is 2/5 × (−3/4)?",["−6/20","6/20","−3/10","3/10"],"C",["Multiply numerators and denominators separately.","2×(−3)=−6, 5×4=20, then simplify.","−6/20 = −3/10."],"Correct! 2/5 × (−3/4) = −6/20 = −3/10."),
    _mcq("m.rn.06","math.rational_numbers","mathematics",0.35,"The multiplicative identity for rationals is:",["0","1","−1","1/2"],"B",["What number, when multiplied, gives the same number?","a × ? = a","That number is 1."],"Correct! Any number × 1 = itself."),
    _mcq("m.rn.07","math.rational_numbers","mathematics",0.45,"Find: −1/2 ÷ 3/4",["−2/3","2/3","−3/8","3/8"],"A",["Dividing by a fraction = multiplying by its reciprocal.","−1/2 × 4/3 = ?","(−1×4)/(2×3) = −4/6 = −2/3."],"Correct! −1/2 ÷ 3/4 = −1/2 × 4/3 = −2/3."),
    _mcq("m.rn.08","math.rational_numbers","mathematics",0.40,"Between 1/3 and 1/2, a rational number is:",["2/5","3/4","1/4","2/3"],"A",["Convert to common denominators to find numbers between them.","1/3 ≈ 0.33, 1/2 = 0.50.","2/5 = 0.40, which is between them."],"Correct! 2/5 = 0.4, between 0.33 and 0.50."),
    _mcq("m.rn.09","math.rational_numbers","mathematics",0.50,"The reciprocal of −3/8 is:",["3/8","−8/3","8/3","−3/8"],"B",["The reciprocal flips numerator and denominator.","Keep the sign the same.","Reciprocal of −3/8 is −8/3."],"Correct! Flip and keep the sign: −8/3."),
    _mcq("m.rn.10","math.rational_numbers","mathematics",0.45,"0 is the _____ identity for rational numbers.",["Multiplicative","Additive","Both","Neither"],"B",["What happens when you add 0 to any number?","a + 0 = a for all rationals.","0 is the additive identity."],"Correct! a + 0 = a, so 0 is the additive identity."),

    # ── Unit 2: Linear Equations ──
    _mcq("m.le.01","math.linear_equations","mathematics",0.30,"Solve: x + 7 = 12",["5","19","7","−5"],"A",["Subtract 7 from both sides.","x = 12 − 7","x = 5."],"Correct! x = 12 − 7 = 5."),
    _mcq("m.le.02","math.linear_equations","mathematics",0.35,"Solve: 3x = 15",["3","5","45","12"],"B",["Divide both sides by 3.","x = 15/3","x = 5."],"Correct! x = 15 ÷ 3 = 5."),
    _mcq("m.le.03","math.linear_equations","mathematics",0.40,"Solve: 2x − 3 = 7",["5","2","4","3"],"A",["Add 3 to both sides first.","2x = 10","x = 5."],"Correct! 2x = 10, x = 5."),
    _mcq("m.le.04","math.linear_equations","mathematics",0.45,"Solve: 5(x − 2) = 15",["5","1","7","3"],"A",["Divide both sides by 5 first.","x − 2 = 3","x = 5."],"Correct! x − 2 = 3, so x = 5."),
    _mcq("m.le.05","math.linear_equations","mathematics",0.50,"Solve: (x+1)/2 = 4",["7","9","3","5"],"A",["Multiply both sides by 2.","x + 1 = 8","x = 7."],"Correct! x + 1 = 8, x = 7."),
    _mcq("m.le.06","math.linear_equations","mathematics",0.45,"If 4x + 3 = 19, what is x?",["4","5","3","6"],"A",["Subtract 3 from both sides.","4x = 16","x = 4."],"Correct! 4x = 16, x = 4."),
    _mcq("m.le.07","math.linear_equations","mathematics",0.55,"Solve: 3(2x + 1) = 21",["3","7","10","4"],"A",["Divide both sides by 3: 2x + 1 = 7.","Subtract 1: 2x = 6.","x = 3."],"Correct! 2x + 1 = 7, 2x = 6, x = 3."),
    _mcq("m.le.08","math.linear_equations","mathematics",0.50,"The value of x in x/3 + 2 = 5 is:",["9","3","7","6"],"A",["Subtract 2: x/3 = 3.","Multiply by 3.","x = 9."],"Correct! x/3 = 3, x = 9."),
    _mcq("m.le.09","math.linear_equations","mathematics",0.60,"Solve: 2x + 3 = x + 7",["4","10","2","7"],"A",["Subtract x from both sides: x + 3 = 7.","Subtract 3.","x = 4."],"Correct! x + 3 = 7, x = 4."),
    _mcq("m.le.10","math.linear_equations","mathematics",0.65,"A number added to its half gives 15. The number is:",["10","15","5","20"],"A",["Let the number be x: x + x/2 = 15.","3x/2 = 15, so 3x = 30.","x = 10."],"Correct! 3x/2 = 15, x = 10."),

    # ── Unit 3: Understanding Quadrilaterals ──
    _mcq("m.qu.01","math.quadrilaterals","mathematics",0.25,"Sum of angles of a quadrilateral is:",["180°","360°","540°","270°"],"B",["A quadrilateral has 4 sides.","Sum = (n−2)×180°.","(4−2)×180 = 360°."],"Correct! Sum of interior angles = 360°."),
    _mcq("m.qu.02","math.quadrilaterals","mathematics",0.30,"A parallelogram has:",["All angles 90°","Opposite sides parallel","All sides equal","No parallel sides"],"B",["What defines a parallelogram?","It has two pairs of parallel sides.","Opposite sides are parallel and equal."],"Correct! A parallelogram has opposite sides parallel."),
    _mcq("m.qu.03","math.quadrilaterals","mathematics",0.35,"Which is NOT a quadrilateral?",["Rectangle","Rhombus","Triangle","Trapezium"],"C",["A quadrilateral has 4 sides.","Count the sides of each shape.","A triangle has only 3 sides."],"Correct! A triangle has 3 sides, not 4."),
    _mcq("m.qu.04","math.quadrilaterals","mathematics",0.40,"The diagonals of a rectangle are:",["Perpendicular","Equal","Unequal","Parallel"],"B",["Think about rectangle properties.","Are the diagonals the same length?","Yes, rectangle diagonals are equal."],"Correct! Rectangle diagonals are equal in length."),
    _mcq("m.qu.05","math.quadrilaterals","mathematics",0.40,"A rhombus has all sides:",["Unequal","Equal","Parallel","Perpendicular"],"B",["What's unique about a rhombus?","Look at its side lengths.","All four sides are equal."],"Correct! All sides of a rhombus are equal."),
    _mcq("m.qu.06","math.quadrilaterals","mathematics",0.45,"If three angles of a quadrilateral are 90°, 80°, 70°, the fourth is:",["120°","100°","110°","130°"],"A",["Sum of all angles = 360°.","90+80+70 = 240°.","360−240 = 120°."],"Correct! 360° − 240° = 120°."),
    _mcq("m.qu.07","math.quadrilaterals","mathematics",0.45,"A square is a special case of:",["Triangle","Rhombus","Pentagon","Circle"],"B",["A square has all sides equal.","A rhombus also has all sides equal.","A square is a rhombus with all right angles."],"Correct! A square is a rhombus with 90° angles."),
    _mcq("m.qu.08","math.quadrilaterals","mathematics",0.50,"How many diagonals does a quadrilateral have?",["1","2","3","4"],"B",["Connect non-adjacent vertices.","In a 4-sided shape, how many such connections?","There are exactly 2 diagonals."],"Correct! A quadrilateral has 2 diagonals."),
    _mcq("m.qu.09","math.quadrilaterals","mathematics",0.50,"A trapezium has exactly ___ pair(s) of parallel sides.",["0","1","2","4"],"B",["What defines a trapezium?","It has at least one pair of parallel sides.","Exactly one pair."],"Correct! A trapezium has exactly 1 pair of parallel sides."),
    _mcq("m.qu.10","math.quadrilaterals","mathematics",0.55,"Each angle of a regular quadrilateral (square) is:",["60°","90°","120°","45°"],"B",["A regular polygon has all equal angles.","360° ÷ 4 = ?","Each angle = 90°."],"Correct! 360° ÷ 4 = 90°."),

    # ── Unit 4: Data Handling ──
    _mcq("m.dh.01","math.data_handling","mathematics",0.25,"The most common value in a dataset is the:",["Mean","Median","Mode","Range"],"C",["Which measure counts frequency?","The value that appears most.","That's the mode."],"Correct! The mode is the most frequent value."),
    _mcq("m.dh.02","math.data_handling","mathematics",0.30,"The mean of 4, 6, 8, 10, 12 is:",["6","8","10","40"],"B",["Add all values: 4+6+8+10+12.","Sum = 40.","Mean = 40/5 = 8."],"Correct! Mean = 40 ÷ 5 = 8."),
    _mcq("m.dh.03","math.data_handling","mathematics",0.35,"A pie chart shows data as:",["Bars","Lines","Sectors of a circle","Points"],"C",["Think about the shape of a pie chart.","It's circular.","Data is shown as sectors."],"Correct! Pie charts use sectors of a circle."),
    _mcq("m.dh.04","math.data_handling","mathematics",0.35,"The range of 3, 7, 2, 9, 5 is:",["7","6","5","9"],"A",["Range = highest − lowest.","Highest=9, lowest=2.","9−2=7."],"Correct! Range = 9 − 2 = 7."),
    _mcq("m.dh.05","math.data_handling","mathematics",0.40,"The median of 1, 3, 5, 7, 9 is:",["3","5","7","1"],"B",["Arrange in order (already done).","Find the middle value.","The 3rd value is 5."],"Correct! The middle value is 5."),
    _mcq("m.dh.06","math.data_handling","mathematics",0.40,"A bar graph uses:",["Circles","Rectangular bars","Curves","Dots"],"B",["Think about what 'bar' means.","Bars are rectangular.","Data is represented by rectangular bars."],"Correct! Bar graphs use rectangular bars."),
    _mcq("m.dh.07","math.data_handling","mathematics",0.45,"If you toss a coin, probability of heads is:",["0","1/2","1","1/4"],"B",["A coin has 2 outcomes.","Only 1 is heads.","P(heads) = 1/2."],"Correct! P(heads) = 1/2."),
    _mcq("m.dh.08","math.data_handling","mathematics",0.45,"The total angle in a pie chart is:",["180°","270°","360°","90°"],"C",["A pie chart is a full circle.","What's the angle of a full circle?","360°."],"Correct! A full circle = 360°."),
    _mcq("m.dh.09","math.data_handling","mathematics",0.50,"Double bar graphs compare:",["One dataset","Two datasets","Three datasets","No data"],"B",["What does 'double' suggest?","Two sets of bars side by side.","It compares two datasets."],"Correct! Double bar graphs compare two datasets."),
    _mcq("m.dh.10","math.data_handling","mathematics",0.50,"The probability of an impossible event is:",["1","1/2","0","−1"],"C",["If something can never happen...","Its probability is the lowest possible.","That's 0."],"Correct! Impossible events have probability 0."),

    # ── Unit 5: Squares and Square Roots ──
    _mcq("m.sr.01","math.squares_roots","mathematics",0.25,"The square of 9 is:",["18","81","72","27"],"B",["Square means multiply by itself.","9 × 9 = ?","81."],"Correct! 9² = 81."),
    _mcq("m.sr.02","math.squares_roots","mathematics",0.30,"√144 =",["11","12","13","14"],"B",["Which number × itself = 144?","Try 12 × 12.","12 × 12 = 144."],"Correct! √144 = 12."),
    _mcq("m.sr.03","math.squares_roots","mathematics",0.35,"Which is a perfect square?",["50","48","49","51"],"C",["A perfect square = n² for some integer.","Try 7 × 7.","7² = 49."],"Correct! 49 = 7²."),
    _mcq("m.sr.04","math.squares_roots","mathematics",0.35,"The unit digit of 23² is:",["3","9","6","4"],"B",["Only the unit digit matters: 3².","3 × 3 = 9.","Unit digit is 9."],"Correct! 3² = 9, so unit digit is 9."),
    _mcq("m.sr.05","math.squares_roots","mathematics",0.40,"How many non-square numbers lie between 5² and 6²?",["10","11","9","8"],"A",["5²=25, 6²=36.","Numbers between: 26,27,...,35.","That's 10 numbers."],"Correct! 36 − 25 − 1 = 10."),
    _mcq("m.sr.06","math.squares_roots","mathematics",0.40,"√(16/25) =",["4/5","16/25","2/5","8/5"],"A",["Take square root of numerator and denominator separately.","√16=4, √25=5.","4/5."],"Correct! √16/√25 = 4/5."),
    _mcq("m.sr.07","math.squares_roots","mathematics",0.45,"If x² = 169, then x =",["11","12","13","14"],"C",["Find √169.","Try 13 × 13.","13² = 169."],"Correct! √169 = 13."),
    _mcq("m.sr.08","math.squares_roots","mathematics",0.45,"The square of an odd number is always:",["Even","Odd","Prime","Zero"],"B",["Try: 3²=9, 5²=25, 7²=49.","All results are odd.","Odd × odd = odd."],"Correct! Odd × odd = odd."),
    _mcq("m.sr.09","math.squares_roots","mathematics",0.50,"3, 4, 5 is a Pythagorean triplet because:",["3+4=5","3²+4²=5²","3×4=5","None"],"B",["Check: 9+16=25.","That's 3²+4²=5².","It satisfies the Pythagorean theorem."],"Correct! 9 + 16 = 25, so 3²+4²=5²."),
    _mcq("m.sr.10","math.squares_roots","mathematics",0.55,"√(1.44) =",["1.2","0.12","12","1.44"],"A",["1.44 = 144/100.","√144=12, √100=10.","12/10 = 1.2."],"Correct! √1.44 = 1.2."),
]

# ═══════════════════════════════════════════════════════════════════════════
# SCIENCE — 5 units × 10 MCQs = 50
# ═══════════════════════════════════════════════════════════════════════════

SCIENCE_QUESTIONS: list[dict[str, Any]] = [
    # ── Unit 1: Crop Production and Management ──
    _mcq("s.cp.01","sci.crop_production","science",0.25,"Which is a Kharif crop?",["Wheat","Paddy","Mustard","Gram"],"B",["Kharif crops are sown in rainy season.","Paddy needs lots of water.","Paddy is a Kharif crop."],"Correct! Paddy is sown in the rainy season (Kharif)."),
    _mcq("s.cp.02","sci.crop_production","science",0.30,"The first step of farming is:",["Harvesting","Sowing","Preparation of soil","Irrigation"],"C",["What must happen before seeds go in?","The soil needs to be prepared.","Tilling/ploughing comes first."],"Correct! Soil preparation is the first step."),
    _mcq("s.cp.03","sci.crop_production","science",0.30,"Weeds are:",["Useful crops","Unwanted plants","Fertilizers","Seeds"],"B",["Weeds compete with crops.","They're not planted intentionally.","Weeds are unwanted plants."],"Correct! Weeds are unwanted plants in a field."),
    _mcq("s.cp.04","sci.crop_production","science",0.35,"Which tool is used for sowing seeds?",["Sickle","Seed drill","Hoe","Plough"],"B",["Which tool places seeds in the soil?","A seed drill sows at proper depth and spacing.","Seed drill is the answer."],"Correct! A seed drill sows seeds uniformly."),
    _mcq("s.cp.05","sci.crop_production","science",0.35,"Nitrogen-fixing bacteria live in roots of:",["Wheat","Legumes","Rice","Cotton"],"B",["Which plants enrich the soil?","Legumes have nodules on roots.","These nodules contain nitrogen-fixing bacteria."],"Correct! Legumes host Rhizobium bacteria."),
    _mcq("s.cp.06","sci.crop_production","science",0.40,"The process of separating grain from chaff is:",["Sowing","Harvesting","Winnowing","Tilling"],"C",["After harvesting, how do you separate grain?","Wind helps blow away lighter chaff.","This is called winnowing."],"Correct! Winnowing uses wind to separate chaff."),
    _mcq("s.cp.07","sci.crop_production","science",0.40,"Which is a Rabi crop?",["Paddy","Maize","Wheat","Soybean"],"C",["Rabi crops are sown in winter.","Wheat is grown in the cold season.","Wheat is a Rabi crop."],"Correct! Wheat is a winter (Rabi) crop."),
    _mcq("s.cp.08","sci.crop_production","science",0.45,"Fertilizers are:",["Natural organic matter","Chemical substances for plant nutrients","Living organisms","Pesticides"],"B",["Fertilizers provide nutrients.","They're manufactured chemically.","Chemical nutrient sources."],"Correct! Fertilizers are chemical nutrient supplements."),
    _mcq("s.cp.09","sci.crop_production","science",0.45,"Food grains are stored in:",["Open fields","Silos and granaries","Rivers","Forests"],"B",["Grains need protection from pests and moisture.","Special storage facilities are used.","Silos and granaries."],"Correct! Silos and granaries protect stored grains."),
    _mcq("s.cp.10","sci.crop_production","science",0.50,"Crop rotation helps in:",["Increasing weeds","Soil fertility maintenance","Reducing yield","Wasting water"],"B",["Different crops use different nutrients.","Rotating prevents soil depletion.","It maintains fertility."],"Correct! Crop rotation maintains soil nutrients."),

    # ── Unit 2: Microorganisms: Friend and Foe ──
    _mcq("s.mo.01","sci.microorganisms","science",0.25,"Which is a useful microorganism?",["Virus causing flu","Lactobacillus","Plasmodium","None"],"B",["Which microbe helps make food?","Lactobacillus makes curd from milk.","It's a useful bacterium."],"Correct! Lactobacillus is used in curd/yogurt making."),
    _mcq("s.mo.02","sci.microorganisms","science",0.30,"Antibiotics are made from:",["Animals","Fungi and bacteria","Rocks","Viruses"],"B",["Penicillin was discovered from a mould.","Moulds are fungi.","Antibiotics come from fungi and bacteria."],"Correct! Penicillin comes from Penicillium fungus."),
    _mcq("s.mo.03","sci.microorganisms","science",0.30,"Malaria is caused by:",["Bacteria","Virus","Protozoa","Fungi"],"C",["Malaria is spread by mosquitoes.","The pathogen is Plasmodium.","Plasmodium is a protozoan."],"Correct! Malaria is caused by Plasmodium (protozoa)."),
    _mcq("s.mo.04","sci.microorganisms","science",0.35,"Yeast is used in making:",["Curd","Bread","Antibiotics","Vaccines"],"B",["Yeast causes fermentation.","It produces CO₂ that makes dough rise.","Bread uses yeast."],"Correct! Yeast fermentation makes bread rise."),
    _mcq("s.mo.05","sci.microorganisms","science",0.35,"Food preservation by salt works because:",["Salt kills all bacteria","Salt removes moisture","Salt adds nutrition","Salt is sweet"],"B",["Why does salt prevent spoilage?","Microbes need water to survive.","Salt draws out moisture (osmosis)."],"Correct! Salt removes moisture, preventing microbial growth."),
    _mcq("s.mo.06","sci.microorganisms","science",0.40,"Vaccination provides:",["Energy","Immunity","Food","Water"],"B",["Vaccines prepare the body to fight diseases.","They stimulate the immune system.","Vaccination provides immunity."],"Correct! Vaccines provide immunity against diseases."),
    _mcq("s.mo.07","sci.microorganisms","science",0.40,"Algae are:",["Always harmful","Producers in aquatic ecosystems","Animals","Fungi"],"B",["Algae can photosynthesize.","They produce food and oxygen.","They're aquatic producers."],"Correct! Algae are primary producers."),
    _mcq("s.mo.08","sci.microorganisms","science",0.45,"Pasteurization involves:",["Freezing milk","Heating and sudden cooling","Adding chemicals","Drying"],"B",["Named after Louis Pasteur.","Milk is heated to kill germs.","Then cooled rapidly."],"Correct! Pasteurization heats then cools to kill pathogens."),
    _mcq("s.mo.09","sci.microorganisms","science",0.45,"Nitrogen fixation is done by:",["Rhizobium","Amoeba","Mushroom","Virus"],"A",["Which microbe fixes atmospheric nitrogen?","It lives in legume root nodules.","Rhizobium fixes nitrogen."],"Correct! Rhizobium fixes atmospheric nitrogen."),
    _mcq("s.mo.10","sci.microorganisms","science",0.50,"Communicable diseases spread through:",["Genetics","Air, water, or contact","Exercise","Sunlight"],"B",["How do infectious diseases transmit?","Through contaminated air, water, or direct contact.","These are communicable pathways."],"Correct! Communicable diseases spread via air, water, or contact."),

    # ── Unit 3: Coal and Petroleum ──
    _mcq("s.cp2.01","sci.coal_petroleum","science",0.25,"Coal is a:",["Renewable resource","Non-renewable resource","Synthetic material","Gas"],"B",["Coal takes millions of years to form.","It can't be replaced quickly.","It's non-renewable."],"Correct! Coal is a non-renewable fossil fuel."),
    _mcq("s.cp2.02","sci.coal_petroleum","science",0.30,"Petroleum is also called:",["Black gold","White gold","Green fuel","Blue fuel"],"A",["Petroleum is extremely valuable.","It's black in color.","Hence 'black gold'."],"Correct! Petroleum is called black gold due to its value."),
    _mcq("s.cp2.03","sci.coal_petroleum","science",0.30,"CNG stands for:",["Compressed Natural Gas","Common Natural Gas","Converted Natural Gas","Central Natural Gas"],"A",["CNG is used in vehicles.","It's natural gas under pressure.","Compressed Natural Gas."],"Correct! CNG = Compressed Natural Gas."),
    _mcq("s.cp2.04","sci.coal_petroleum","science",0.35,"Coal tar is used to make:",["Food","Dyes and paints","Electricity directly","Clothes"],"B",["Coal tar is a thick liquid from coal processing.","It contains useful chemicals.","Used in dyes, paints, explosives."],"Correct! Coal tar is used in dyes, paints, and more."),
    _mcq("s.cp2.05","sci.coal_petroleum","science",0.35,"Which gas is found in natural gas?",["Oxygen","Methane","Nitrogen","Helium"],"B",["Natural gas burns cleanly.","Its main component is CH₄.","That's methane."],"Correct! Natural gas is mainly methane (CH₄)."),
    _mcq("s.cp2.06","sci.coal_petroleum","science",0.40,"Fossil fuels formed from:",["Modern plants","Ancient organisms","Seawater","Volcanic ash"],"B",["'Fossil' refers to ancient remains.","Dead organisms got buried millions of years ago.","They turned into fuels."],"Correct! Fossil fuels formed from ancient organisms."),
    _mcq("s.cp2.07","sci.coal_petroleum","science",0.40,"Petroleum refining separates it into:",["One product","Multiple fractions","Pure elements","Water"],"B",["Crude oil is a mixture.","Fractional distillation separates it.","Into petrol, diesel, kerosene, etc."],"Correct! Refining yields multiple fractions."),
    _mcq("s.cp2.08","sci.coal_petroleum","science",0.45,"Which is NOT a petroleum product?",["Petrol","Diesel","Coal","Kerosene"],"C",["Petrol, diesel, kerosene come from petroleum.","Coal is mined separately.","Coal is not a petroleum product."],"Correct! Coal is a separate fossil fuel, not from petroleum."),
    _mcq("s.cp2.09","sci.coal_petroleum","science",0.45,"PCRA advises to:",["Use more fuel","Save fuel","Waste fuel","Burn fuel for fun"],"B",["PCRA = Petroleum Conservation Research Association.","Their goal is conservation.","They advise saving fuel."],"Correct! PCRA promotes fuel conservation."),
    _mcq("s.cp2.10","sci.coal_petroleum","science",0.50,"The best way to conserve fossil fuels is:",["Mine more","Use alternative energy sources","Ignore the problem","Burn them faster"],"B",["Fossil fuels are limited.","We need sustainable alternatives.","Solar, wind, etc. help conserve."],"Correct! Alternative energy sources reduce fossil fuel dependence."),

    # ── Unit 4: Combustion and Flame ──
    _mcq("s.cf.01","sci.combustion_flame","science",0.25,"Combustion requires:",["Water","Fuel, heat, and oxygen","Only fuel","Only air"],"B",["What three things does fire need?","The fire triangle.","Fuel + heat + oxygen."],"Correct! The fire triangle: fuel, heat, and oxygen."),
    _mcq("s.cf.02","sci.combustion_flame","science",0.30,"The lowest temperature at which a substance catches fire is its:",["Boiling point","Ignition temperature","Melting point","Dew point"],"B",["At what temperature does something ignite?","This is called the ignition temperature.","It's the minimum temp for combustion."],"Correct! The ignition temperature starts combustion."),
    _mcq("s.cf.03","sci.combustion_flame","science",0.30,"Which zone of a flame is the hottest?",["Dark zone","Luminous zone","Non-luminous zone","All same"],"C",["The outermost zone gets the most oxygen.","Complete combustion occurs there.","The non-luminous zone is hottest."],"Correct! The outer non-luminous zone is hottest."),
    _mcq("s.cf.04","sci.combustion_flame","science",0.35,"Water is used to extinguish fire because it:",["Is a fuel","Cools below ignition temperature","Adds oxygen","Is flammable"],"B",["How does water stop fire?","It absorbs heat.","Cooling below ignition temperature."],"Correct! Water cools the material below its ignition temperature."),
    _mcq("s.cf.05","sci.combustion_flame","science",0.35,"LPG is a:",["Solid fuel","Liquid fuel","Gaseous fuel","Not a fuel"],"C",["LPG = Liquefied Petroleum Gas.","It's gas compressed into liquid form.","Used as a gaseous fuel."],"Correct! LPG is a gaseous fuel stored as liquid."),
    _mcq("s.cf.06","sci.combustion_flame","science",0.40,"Burning of magnesium ribbon is:",["Slow combustion","Rapid combustion","Spontaneous combustion","Explosion"],"B",["Magnesium burns quickly with a bright flame.","It happens fast when ignited.","That's rapid combustion."],"Correct! Magnesium ribbon undergoes rapid combustion."),
    _mcq("s.cf.07","sci.combustion_flame","science",0.40,"CO₂ extinguisher works by:",["Cooling","Cutting off oxygen supply","Adding fuel","Increasing heat"],"B",["CO₂ is heavier than air.","It covers the fire, blocking oxygen.","Cuts off oxygen supply."],"Correct! CO₂ blankets the fire, removing oxygen."),
    _mcq("s.cf.08","sci.combustion_flame","science",0.45,"An ideal fuel should have:",["High ignition temperature","Moderate calorific value","High calorific value and low pollution","Maximum smoke"],"C",["Good fuel = lots of energy, less pollution.","High calorific value means more energy.","And low pollution is essential."],"Correct! Ideal fuel: high energy, low pollution."),
    _mcq("s.cf.09","sci.combustion_flame","science",0.45,"Forest fires are an example of:",["Rapid combustion","Slow combustion","Spontaneous combustion","No combustion"],"C",["Forest fires can start without external ignition.","Heat builds up naturally.","That's spontaneous combustion."],"Correct! Forest fires can result from spontaneous combustion."),
    _mcq("s.cf.10","sci.combustion_flame","science",0.50,"Calorific value is measured in:",["Liters","Celsius","kJ/kg","Meters"],"C",["It measures energy per unit mass.","Energy in kilojoules per kilogram.","kJ/kg."],"Correct! Calorific value is measured in kJ/kg."),

    # ── Unit 5: Conservation of Plants and Animals ──
    _mcq("s.co.01","sci.conservation","science",0.25,"A protected area for wildlife is called:",["Farm","Sanctuary","Market","Factory"],"B",["Where are wild animals protected?","Wildlife sanctuaries.","They're protected areas."],"Correct! Wildlife sanctuaries protect animals."),
    _mcq("s.co.02","sci.conservation","science",0.30,"Deforestation means:",["Planting trees","Cutting down forests","Watering plants","Growing crops"],"B",["'De' means removal.","Removing forests.","Cutting down trees on a large scale."],"Correct! Deforestation is large-scale removal of forests."),
    _mcq("s.co.03","sci.conservation","science",0.30,"The Red Data Book lists:",["All animals","Endangered species","Cooking recipes","Weather data"],"B",["Which book tracks species at risk?","The Red Data Book.","It lists endangered species."],"Correct! The Red Data Book records endangered species."),
    _mcq("s.co.04","sci.conservation","science",0.35,"An endemic species is found:",["Everywhere","Only in a particular area","In oceans only","Nowhere"],"B",["'Endemic' means exclusive to a region.","Found nowhere else.","Specific to a particular area."],"Correct! Endemic species are unique to specific areas."),
    _mcq("s.co.05","sci.conservation","science",0.35,"Biosphere reserve protects:",["Only animals","Biodiversity of the area","Only plants","Only insects"],"B",["Biosphere = life sphere.","It protects all living things in the area.","The entire biodiversity."],"Correct! Biosphere reserves protect biodiversity."),
    _mcq("s.co.06","sci.conservation","science",0.40,"Which is a consequence of deforestation?",["More rain","Soil erosion","Cooler climate","More trees"],"B",["Without tree roots...","Soil is exposed to wind and rain.","Erosion increases."],"Correct! Deforestation leads to soil erosion."),
    _mcq("s.co.07","sci.conservation","science",0.40,"A species that no longer exists is called:",["Endangered","Exotic","Extinct","Endemic"],"C",["When every individual has died...","The species is gone forever.","It's extinct."],"Correct! Extinct means no living individuals remain."),
    _mcq("s.co.08","sci.conservation","science",0.45,"Reforestation means:",["Cutting trees","Planting trees in deforested areas","Building roads","Mining"],"B",["'Re' means again.","Planting forests where they were cut.","Restoring forest cover."],"Correct! Reforestation restores forest cover."),
    _mcq("s.co.09","sci.conservation","science",0.45,"National parks differ from sanctuaries in that they:",["Allow hunting","Have stricter protection","Have no animals","Are smaller"],"B",["National parks have more restrictions.","No human activities like grazing allowed.","Stricter protection."],"Correct! National parks have stricter regulations."),
    _mcq("s.co.10","sci.conservation","science",0.50,"Paper recycling helps because:",["It wastes water","It saves trees","It creates pollution","It's expensive"],"B",["Paper comes from trees.","Recycling means fewer trees cut.","Saves trees!"],"Correct! Recycling paper saves trees from being cut."),
]

# ═══════════════════════════════════════════════════════════════════════════
# ENGLISH — 5 units × 10 MCQs = 50
# ═══════════════════════════════════════════════════════════════════════════

ENGLISH_QUESTIONS: list[dict[str, Any]] = [
    # ── Unit 1: The Best Christmas Present ──
    _mcq("e.xm.01","eng.christmas_present","english",0.25,"'The Best Christmas Present in the World' is set during:",["World War I","World War II","Modern times","Medieval era"],"A",["The story involves soldiers in trenches.","The Christmas truce of 1914.","It's set in World War I."],"Correct! The story references the WWI Christmas truce."),
    _mcq("e.xm.02","eng.christmas_present","english",0.30,"The narrator finds a letter inside:",["A book","A roll-top desk","A cupboard","A suitcase"],"B",["The narrator buys old furniture.","It's a roll-top desk.","The letter is hidden inside."],"Correct! The letter was in a roll-top desk."),
    _mcq("e.xm.03","eng.christmas_present","english",0.30,"Jim's letter was written to:",["His mother","His wife Connie","His friend","His son"],"B",["Jim wrote from the trenches.","To his beloved wife.","Her name is Connie."],"Correct! The letter was to his wife Connie."),
    _mcq("e.xm.04","eng.christmas_present","english",0.35,"The word 'truce' means:",["War","Temporary peace","Weapon","Letter"],"B",["During Christmas, fighting stopped.","Both sides agreed temporarily.","A truce is temporary peace."],"Correct! A truce is a temporary agreement to stop fighting."),
    _mcq("e.xm.05","eng.christmas_present","english",0.35,"The old lady mistakes the narrator for:",["A doctor","Jim","A soldier","A neighbor"],"B",["She is very old and confused.","She thinks the visitor is her husband.","She calls him Jim."],"Correct! Mrs. Macpherson thinks the narrator is Jim."),
    _mcq("e.xm.06","eng.christmas_present","english",0.40,"The moral of the story is about:",["Money","Peace and humanity","Technology","Sports"],"B",["The Christmas truce showed human kindness.","Even enemies shared goodwill.","It's about peace and humanity."],"Correct! The story celebrates peace and human connection."),
    _mcq("e.xm.07","eng.christmas_present","english",0.40,"In 'The Ant and the Cricket', the cricket represents:",["Hard work","Laziness","Wisdom","Courage"],"B",["The cricket sang all summer.","Didn't prepare for winter.","Represents laziness/negligence."],"Correct! The cricket represents not planning ahead."),
    _mcq("e.xm.08","eng.christmas_present","english",0.45,"A synonym for 'musty' is:",["Fresh","Stale","Bright","Sweet"],"B",["Musty describes old, damp things.","The desk smelled old.","Stale or mouldy."],"Correct! Musty means stale or damp-smelling."),
    _mcq("e.xm.09","eng.christmas_present","english",0.45,"The narrative technique used is:",["First person","Third person","Second person","Stream of consciousness"],"A",["The narrator says 'I'.","They describe personal experiences.","First person narration."],"Correct! 'I' indicates first-person narration."),
    _mcq("e.xm.10","eng.christmas_present","english",0.50,"The theme of sharing across enemy lines shows:",["Hatred","Universal human values","Revenge","Competition"],"B",["Enemies celebrated together.","Despite the war.","Human values transcend conflict."],"Correct! It shows universal human values."),

    # ── Unit 2: The Tsunami ──
    _mcq("e.ts.01","eng.tsunami","english",0.25,"The tsunami of 2004 originated in:",["Atlantic Ocean","Indian Ocean","Pacific Ocean","Arctic Ocean"],"B",["The 2004 disaster hit South/Southeast Asia.","It started in the Indian Ocean.","Near Indonesia."],"Correct! The 2004 tsunami started in the Indian Ocean."),
    _mcq("e.ts.02","eng.tsunami","english",0.30,"Meghna's family in the story was from:",["Japan","Andaman","Sri Lanka","Thailand"],"B",["The story follows families from Indian islands.","The Andaman and Nicobar Islands.","Meghna was from there."],"Correct! Meghna was from the Andaman Islands."),
    _mcq("e.ts.03","eng.tsunami","english",0.30,"Tilly Smith saved people because she:",["Could swim fast","Recognized tsunami signs from school","Had a boat","Was very tall"],"B",["Tilly had learned about tsunamis.","She noticed the sea receding.","Her geography lesson saved lives."],"Correct! Tilly recognized signs she learned in school."),
    _mcq("e.ts.04","eng.tsunami","english",0.35,"The word 'devastation' means:",["Beauty","Severe destruction","Growth","Happiness"],"B",["The tsunami caused massive damage.","Cities were destroyed.","Devastation = severe destruction."],"Correct! Devastation means severe destruction."),
    _mcq("e.ts.05","eng.tsunami","english",0.35,"Animals sensed the tsunami because:",["They were told","They have sharper instincts","They read news","They saw it"],"B",["Animals fled before the wave hit.","They sensed vibrations.","Animals have sharper natural instincts."],"Correct! Animals have keen sensory instincts."),
    _mcq("e.ts.06","eng.tsunami","english",0.40,"'Geography Lesson' is a poem about:",["History","Viewing Earth from above","Mathematics","Cooking"],"B",["The poet is in an airplane.","Looking down at the Earth.","Seeing geographical patterns."],"Correct! The poem describes Earth viewed from a plane."),
    _mcq("e.ts.07","eng.tsunami","english",0.40,"The main message of The Tsunami chapter is:",["Entertainment","Disaster preparedness and resilience","Sports","Fashion"],"B",["The stories show survival and courage.","And the importance of awareness.","Preparedness and resilience."],"Correct! The chapter emphasizes preparedness and resilience."),
    _mcq("e.ts.08","eng.tsunami","english",0.45,"An antonym of 'destruction' is:",["Demolition","Construction","Ruin","Decay"],"B",["What's the opposite of destroying?","Building something.","Construction."],"Correct! Construction is the opposite of destruction."),
    _mcq("e.ts.09","eng.tsunami","english",0.45,"Cause and effect writing:",["Tells a story","Explains why things happen","Describes places","Lists items"],"B",["'Cause' = reason, 'effect' = result.","This structure explains relationships.","Why things happen and what results."],"Correct! Cause and effect explains reasons and results."),
    _mcq("e.ts.10","eng.tsunami","english",0.50,"Imagery in 'Geography Lesson' appeals to:",["Taste","Sight","Smell","Touch"],"B",["The poet describes what they see below.","Visual descriptions dominate.","Sight/visual imagery."],"Correct! The poem uses visual imagery."),

    # ── Unit 3: Glimpses of the Past ──
    _mcq("e.gp.01","eng.glimpses_past","english",0.25,"'Glimpses of the Past' is told through:",["Letters","A visual narrative (comic format)","Poems","Songs"],"B",["It uses illustrations and captions.","Like a comic or graphic narrative.","Visual narrative format."],"Correct! It uses a visual/comic narrative style."),
    _mcq("e.gp.02","eng.glimpses_past","english",0.30,"The chapter covers Indian history around:",["1757–1857","1947–2000","500 BC","2000 AD"],"A",["It covers the period before the First War of Independence.","British colonization and resistance.","Roughly 1757–1857."],"Correct! It covers 1757–1857."),
    _mcq("e.gp.03","eng.glimpses_past","english",0.30,"Raja Ram Mohan Roy fought against:",["Education","Social evils like Sati","Science","Agriculture"],"B",["He was a social reformer.","He campaigned against harmful practices.","Including Sati."],"Correct! He fought against social evils like Sati."),
    _mcq("e.gp.04","eng.glimpses_past","english",0.35,"The Revolt of 1857 is also called:",["World War","The First War of Independence","A festival","A debate"],"B",["It was India's first major uprising.","Against British rule.","First War of Independence."],"Correct! The 1857 revolt = First War of Independence."),
    _mcq("e.gp.05","eng.glimpses_past","english",0.35,"The British brought in:",["Freedom for all","Railways and exploitation","Democracy immediately","Equal rights"],"B",["The British built infrastructure.","But also exploited India.","Railways came with exploitation."],"Correct! The British brought railways but exploited resources."),
    _mcq("e.gp.06","eng.glimpses_past","english",0.40,"A 'glimpse' means:",["A long study","A brief look","A written report","A song"],"B",["The title says 'glimpses'.","Short, brief views.","A quick look."],"Correct! A glimpse is a brief or quick look."),
    _mcq("e.gp.07","eng.glimpses_past","english",0.40,"Tipu Sultan was the ruler of:",["Delhi","Mysore","Bengal","Punjab"],"B",["He resisted British expansion.","He ruled a southern Indian kingdom.","Mysore."],"Correct! Tipu Sultan ruled Mysore."),
    _mcq("e.gp.08","eng.glimpses_past","english",0.45,"Historical perspective means:",["Ignoring the past","Understanding events in their context","Future predictions","Fiction writing"],"B",["Perspective = viewpoint.","Historical = of the past.","Understanding past events in context."],"Correct! It means understanding past events in their context."),
    _mcq("e.gp.09","eng.glimpses_past","english",0.45,"Evidence from text means:",["Making up facts","Supporting claims with textual references","Guessing","Copying"],"B",["When analyzing a text...","You use quotes or references.","To support your interpretation."],"Correct! Evidence from text means using textual proof."),
    _mcq("e.gp.10","eng.glimpses_past","english",0.50,"The visual narrative format is effective because:",["It's harder to read","Images and text together enhance understanding","It has no text","It's only for children"],"B",["Visuals complement words.","They create a richer understanding.","Images + text = more engaging."],"Correct! Visuals and text together enhance comprehension."),

    # ── Unit 4: Bepin Choudhury's Lapse of Memory ──
    _mcq("e.bc.01","eng.bepin_choudhury","english",0.25,"Bepin Choudhury was approached by a stranger named:",["Chunilal","Haridas","Dinesh","Parimal"],"A",["A man claims to know him.","His name is Chunilal.","He tells Bepin about a trip."],"Correct! Chunilal approached Bepin."),
    _mcq("e.bc.02","eng.bepin_choudhury","english",0.30,"Chunilal claimed Bepin had visited:",["Mumbai","Ranchi","Delhi","Kolkata"],"B",["Chunilal described a specific trip.","To a hill station in Jharkhand.","Ranchi."],"Correct! Chunilal said Bepin had visited Ranchi."),
    _mcq("e.bc.03","eng.bepin_choudhury","english",0.30,"Bepin's problem was:",["He couldn't walk","He couldn't remember the trip","He lost money","He was ill"],"B",["He had no memory of the event.","A lapse of memory.","He couldn't recall the Ranchi trip."],"Correct! Bepin couldn't remember the trip at all."),
    _mcq("e.bc.04","eng.bepin_choudhury","english",0.35,"The word 'lapse' means:",["Improvement","Temporary failure or slip","Success","Growth"],"B",["Memory lapse = forgetting.","A temporary slip.","A brief failure."],"Correct! A lapse is a temporary failure or slip."),
    _mcq("e.bc.05","eng.bepin_choudhury","english",0.35,"At the end we learn the whole thing was:",["Real","A practical joke by Chunilal","A dream","Magic"],"B",["Chunilal needed Bepin's help.","He created an elaborate trick.","A practical joke to get attention."],"Correct! It was Chunilal's elaborate practical joke."),
    _mcq("e.bc.06","eng.bepin_choudhury","english",0.40,"Character inference means:",["Copying characters","Understanding a character from their actions/words","Drawing characters","Ignoring characters"],"B",["We learn about people from what they do and say.","Inferring = drawing conclusions.","Understanding from evidence."],"Correct! It means understanding characters through their behavior."),
    _mcq("e.bc.07","eng.bepin_choudhury","english",0.40,"Bepin's reaction to Chunilal shows he is:",["Careless","Anxious and easily disturbed","Brave","Indifferent"],"B",["He panics and visits a doctor.","He's deeply troubled.","Anxious and vulnerable."],"Correct! Bepin's panic shows anxiety."),
    _mcq("e.bc.08","eng.bepin_choudhury","english",0.45,"'The Last Bargain' poem is about seeking:",["Money","A worthy master","Food","Shelter"],"B",["The speaker looks for employment.","Someone worth working for.","A worthy master who offers true value."],"Correct! It's about finding a worthy master."),
    _mcq("e.bc.09","eng.bepin_choudhury","english",0.45,"Plot development in this story follows:",["Climax first","Problem → rising tension → resolution","No structure","Random events"],"B",["It starts with confusion.","Tension builds as Bepin investigates.","Then the truth is revealed."],"Correct! Classic problem → tension → resolution."),
    _mcq("e.bc.10","eng.bepin_choudhury","english",0.50,"The story teaches that:",["Lying is good","We should help friends in need","Memory is perfect","Strangers are always right"],"B",["Chunilal's trick was desperate.","Because Bepin ignored his pleas for help.","We should help friends."],"Correct! The story highlights helping friends in need."),

    # ── Unit 5: The Summit Within ──
    _mcq("e.sw.01","eng.summit_within","english",0.25,"'The Summit Within' is about climbing:",["K2","Mount Everest","Kilimanjaro","Alps"],"B",["The author describes conquering the highest peak.","The summit = the top of Everest.","Mount Everest."],"Correct! The essay describes climbing Mount Everest."),
    _mcq("e.sw.02","eng.summit_within","english",0.30,"The author of 'The Summit Within' is:",["Tenzing Norgay","HPS Ahluwalia","Edmund Hillary","Jim Corbett"],"B",["He was part of the 1965 Indian expedition.","HPS Ahluwalia.","He climbed Everest in 1965."],"Correct! Major HPS Ahluwalia wrote 'The Summit Within'."),
    _mcq("e.sw.03","eng.summit_within","english",0.30,"The 'summit within' refers to:",["A mountain top","Inner challenges to conquer","A deep valley","A building"],"B",["The title is metaphorical.","Beyond the physical mountain.","Inner personal challenges."],"Correct! It refers to conquering inner challenges."),
    _mcq("e.sw.04","eng.summit_within","english",0.35,"Reflective writing involves:",["Listing facts","Personal thoughts and feelings","Fiction only","News reporting"],"B",["The author shares personal experiences.","And what they mean to him.","Thoughts and feelings about events."],"Correct! Reflective writing explores personal thoughts."),
    _mcq("e.sw.05","eng.summit_within","english",0.35,"The climbers left on the summit:",["Food","A picture of Guru Nanak","Nothing","Clothes"],"B",["Ahluwalia left something meaningful.","A religious/personal item.","A picture of Guru Nanak."],"Correct! Ahluwalia left a picture of Guru Nanak."),
    _mcq("e.sw.06","eng.summit_within","english",0.40,"The word 'formidable' means:",["Easy","Inspiring fear or respect","Small","Funny"],"B",["Everest is a formidable challenge.","Something that commands respect.","Difficult and intimidating."],"Correct! Formidable means inspiring fear or respect."),
    _mcq("e.sw.07","eng.summit_within","english",0.40,"'The School Boy' poem is by:",["Wordsworth","William Blake","Keats","Shelley"],"B",["The poem is about a boy who loves nature.","But hates school.","By William Blake."],"Correct! William Blake wrote 'The School Boy'."),
    _mcq("e.sw.08","eng.summit_within","english",0.45,"Author's purpose in this essay is to:",["Entertain only","Inspire and reflect","Sell products","Criticize others"],"B",["The author shares a life-changing experience.","To motivate readers.","Inspire and encourage reflection."],"Correct! The purpose is to inspire and encourage reflection."),
    _mcq("e.sw.09","eng.summit_within","english",0.45,"Voice in poetry refers to:",["Volume","The speaker's perspective and tone","Sound effects","Echo"],"B",["Who is speaking in the poem?","What attitude do they have?","The speaker's perspective and tone."],"Correct! Voice = the speaker's perspective and tone."),
    _mcq("e.sw.10","eng.summit_within","english",0.50,"The essay suggests that the greatest victory is:",["Defeating others","Conquering oneself","Earning money","Being famous"],"B",["The 'summit within' is personal.","The hardest battle is internal.","Conquering oneself."],"Correct! The greatest victory is over one's own limitations."),
]

# ═══════════════════════════════════════════════════════════════════════════
# Combined bank — imported by tutor.py
# ═══════════════════════════════════════════════════════════════════════════

ALL_SUBJECT_QUESTIONS: dict[str, dict[str, Any]] = {}
for _q in MATH_QUESTIONS + SCIENCE_QUESTIONS + ENGLISH_QUESTIONS:
    ALL_SUBJECT_QUESTIONS[_q["id"]] = _q
