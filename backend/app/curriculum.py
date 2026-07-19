"""Source-linked Grade 8 curriculum metadata; no textbook body text is stored."""

CURRICULUM_SOURCES = (
    ("ncert-mathematics-viii-2024", "NCERT Mathematics Textbook for Class VIII (2024–25 reprint)", "https://ncert.nic.in/textbook/pdf/hemh1ps.pdf"),
    ("ncert-science-viii-2024", "NCERT Science Textbook for Class VIII (2024–25 reprint)", "https://ncert.nic.in/textbook/pdf/hesc1ps.pdf"),
    ("ncert-honeydew-viii-2024", "NCERT Honeydew Textbook for Class VIII (2024–25 reprint)", "https://ncert.nic.in/textbook/pdf/hehd1ps.pdf"),
)

# Each record is: subject slug, unit slug, source title, sequence, three authored concept labels.
CURRICULUM_UNITS = (
    ("mathematics", "rational-numbers", "Rational Numbers", 1, ("Representing rational numbers", "Operations on rational numbers", "Rational numbers on a number line")),
    ("mathematics", "linear-equations-in-one-variable", "Linear Equations in One Variable", 2, ("Equation structure", "Solving one-variable equations", "Checking a solution")),
    ("mathematics", "understanding-quadrilaterals", "Understanding Quadrilaterals", 3, ("Properties of polygons", "Angle sums", "Special quadrilaterals")),
    ("mathematics", "data-handling", "Data Handling", 4, ("Organising data", "Interpreting graphs", "Central tendency")),
    ("mathematics", "squares-and-square-roots", "Squares and Square Roots", 5, ("Perfect squares", "Finding square roots", "Pythagorean triples")),
    ("mathematics", "cubes-and-cube-roots", "Cubes and Cube Roots", 6, ("Perfect cubes", "Finding cube roots", "Prime factor patterns")),
    ("mathematics", "comparing-quantities", "Comparing Quantities", 7, ("Percentages", "Profit, loss and discount", "Simple interest")),
    ("mathematics", "algebraic-expressions-and-identities", "Algebraic Expressions and Identities", 8, ("Terms and coefficients", "Algebraic identities", "Expanding expressions")),
    ("mathematics", "mensuration", "Mensuration", 9, ("Area of plane figures", "Volume of solids", "Surface area")),
    ("mathematics", "exponents-and-powers", "Exponents and Powers", 10, ("Laws of exponents", "Powers of ten", "Standard form")),
    ("mathematics", "direct-and-inverse-proportions", "Direct and Inverse Proportions", 11, ("Direct proportion", "Inverse proportion", "Proportional reasoning")),
    ("mathematics", "factorisation", "Factorisation", 12, ("Common factors", "Factorisation by grouping", "Using identities to factorise")),
    ("mathematics", "introduction-to-graphs", "Introduction to Graphs", 13, ("Cartesian coordinates", "Linear graphs", "Interpreting relationships")),
    ("science", "crop-production-and-management", "Crop Production and Management", 1, ("Agricultural practices", "Crop protection", "Food storage")),
    ("science", "microorganisms-friend-and-foe", "Microorganisms: Friend and Foe", 2, ("Useful microorganisms", "Disease and prevention", "Food preservation")),
    ("science", "coal-and-petroleum", "Coal and Petroleum", 3, ("Fossil fuels", "Petroleum products", "Conservation of resources")),
    ("science", "combustion-and-flame", "Combustion and Flame", 4, ("Types of combustion", "Flame zones", "Fuel efficiency")),
    ("science", "conservation-of-plants-and-animals", "Conservation of Plants and Animals", 5, ("Deforestation", "Protected areas", "Biodiversity conservation")),
    ("science", "reproduction-in-animals", "Reproduction in Animals", 6, ("Modes of reproduction", "Human reproduction", "Life cycles")),
    ("science", "reaching-the-age-of-adolescence", "Reaching the Age of Adolescence", 7, ("Hormonal changes", "Puberty and health", "Adolescent well-being")),
    ("science", "force-and-pressure", "Force and Pressure", 8, ("Contact and non-contact forces", "Pressure in fluids", "Atmospheric pressure")),
    ("science", "friction", "Friction", 9, ("Effects of friction", "Controlling friction", "Fluid friction")),
    ("science", "sound", "Sound", 10, ("Vibration and sound", "Human hearing", "Noise pollution")),
    ("science", "chemical-effects-of-electric-current", "Chemical Effects of Electric Current", 11, ("Conducting liquids", "Electroplating", "Applications of chemical effects")),
    ("science", "some-natural-phenomena", "Some Natural Phenomena", 12, ("Lightning safety", "Earthquakes", "Seismic preparedness")),
    ("science", "light", "Light", 13, ("Reflection", "Multiple reflections", "Human eye and vision")),
    ("english", "the-best-christmas-present", "The Best Christmas Present in the World / The Ant and the Cricket", 1, ("Reading for main idea", "Narrative sequence", "Poetic comparison")),
    ("english", "the-tsunami", "The Tsunami / Geography Lesson", 2, ("Informational reading", "Cause and effect", "Imagery in poetry")),
    ("english", "glimpses-of-the-past", "Glimpses of the Past", 3, ("Visual narrative", "Historical perspective", "Evidence from text")),
    ("english", "bepin-choudhurys-lapse-of-memory", "Bepin Choudhury’s Lapse of Memory / The Last Bargain", 4, ("Character inference", "Plot development", "Speaker and theme")),
    ("english", "the-summit-within", "The Summit Within / The School Boy", 5, ("Reflective writing", "Author’s purpose", "Voice in poetry")),
    ("english", "this-is-jodys-fawn", "This is Jody’s Fawn", 6, ("Character motivation", "Descriptive details", "Vocabulary in context")),
    ("english", "a-visit-to-cambridge", "A Visit to Cambridge", 7, ("Interview structure", "Respectful dialogue", "Perspective taking")),
    ("english", "a-short-monsoon-diary", "A Short Monsoon Diary / On the Grasshopper and Cricket", 8, ("Diary writing", "Observation and detail", "Nature in poetry")),
)

SOURCE_FOR_SUBJECT = {
    "mathematics": "ncert-mathematics-viii-2024",
    "science": "ncert-science-viii-2024",
    "english": "ncert-honeydew-viii-2024",
}
