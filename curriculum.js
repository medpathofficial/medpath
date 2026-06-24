/* ═══════════════════════════════════════════
   MEDPATH — CURRICULUM
   Version: 1.0
   Scope: Phase 1 only (1st Professional MBBS)
   Subjects: Anatomy, Physiology, Biochemistry
   Source: NMC competency-based curriculum

   Structure:
   Phase → Subject → Section → Chapter → Topic

   Importance tags:
   Essential   = Cannot afford to forget. Heavy in exams.
   Foundation  = Builds understanding of other topics.
   Standard    = Important but lower yield.

   Read-only. Never modified by app.
═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   PHASE 1 CURRICULUM DATA
═══════════════════════════════════════════ */

const PHASE_1_CURRICULUM = {
  phaseId: "phase_1",
  phaseName: "1st Professional",
  subjects: [

    /* ─────────────────────────────────────
       SUBJECT: ANATOMY
    ───────────────────────────────────── */
    {
      subjectId: "anatomy",
      subjectName: "Anatomy",
      sections: [

        {
          sectionId: "general-anatomy",
          sectionName: "General Anatomy",
          chapters: [

            {
              chapterId: "anatomical-terminology",
              chapterName: "Anatomical Terminology and Tissues",
              topics: [
                { topicId: "normal-anatomical-position", topicName: "Normal anatomical position, planes and terms of relation", importance: "Foundation" },
                { topicId: "bone-classification", topicName: "Bone classification, blood supply and laws of ossification", importance: "Foundation" },
                { topicId: "types-of-epiphysis", topicName: "Types of epiphysis and structural distribution", importance: "Essential" },
                { topicId: "joints-classification", topicName: "Classification of joints with examples", importance: "Foundation" },
                { topicId: "muscle-types", topicName: "Types of muscles and their actions", importance: "Standard" }
              ]
            },

            {
              chapterId: "circulatory-integumentary",
              chapterName: "Circulatory and Integumentary Systems",
              topics: [
                { topicId: "general-circulation", topicName: "General organization of circulatory system", importance: "Foundation" },
                { topicId: "skin-structure", topicName: "Skin structure and appendages", importance: "Standard" },
                { topicId: "lymphatic-system-general", topicName: "Lymphatic system organization", importance: "Foundation" }
              ]
            }

          ]
        },

        {
          sectionId: "gross-anatomy",
          sectionName: "Gross Anatomy",
          chapters: [

            {
              chapterId: "upper-limb",
              chapterName: "Upper Limb",
              topics: [
                { topicId: "mammary-gland", topicName: "Mammary gland morphology and lymphatic drainage", importance: "Essential" },
                { topicId: "brachial-plexus", topicName: "Brachial plexus formation and branches", importance: "Essential" },
                { topicId: "erbs-klumpkes-palsy", topicName: "Erb's palsy and Klumpke's paralysis", importance: "Essential" },
                { topicId: "cubital-fossa", topicName: "Cubital fossa", importance: "Foundation" },
                { topicId: "fascial-spaces-hand", topicName: "Fascial spaces of the hand", importance: "Foundation" },
                { topicId: "shoulder-elbow-wrist-joints", topicName: "Shoulder, elbow and wrist joint dynamics", importance: "Essential" },
                { topicId: "nerve-injuries-upper-limb", topicName: "Nerve injuries of upper limb", importance: "Essential" },
                { topicId: "axilla-contents", topicName: "Axilla boundaries and contents", importance: "Foundation" },
                { topicId: "hand-arches", topicName: "Arches of the hand", importance: "Standard" }
              ]
            },

            {
              chapterId: "lower-limb",
              chapterName: "Lower Limb",
              topics: [
                { topicId: "femoral-triangle", topicName: "Femoral triangle boundaries and contents", importance: "Essential" },
                { topicId: "popliteal-fossa", topicName: "Popliteal fossa", importance: "Foundation" },
                { topicId: "arches-of-foot", topicName: "Arches of the foot", importance: "Foundation" },
                { topicId: "hip-joint", topicName: "Hip joint anatomy and stability", importance: "Essential" },
                { topicId: "knee-joint", topicName: "Knee joint structure and movements", importance: "Essential" },
                { topicId: "ankle-joint", topicName: "Ankle joint structure", importance: "Foundation" },
                { topicId: "lumbosacral-plexus", topicName: "Lumbosacral plexus", importance: "Essential" },
                { topicId: "venous-drainage-lower-limb", topicName: "Venous drainage and varicose veins", importance: "Foundation" }
              ]
            },

            {
              chapterId: "thorax",
              chapterName: "Thorax",
              topics: [
                { topicId: "thoracic-cage", topicName: "Thoracic cage and intercostal spaces", importance: "Foundation" },
                { topicId: "lungs-bronchopulmonary", topicName: "Lungs and bronchopulmonary segments", importance: "Essential" },
                { topicId: "mediastinum", topicName: "Mediastinum divisions and contents", importance: "Essential" },
                { topicId: "heart-anatomy", topicName: "Heart chambers, valves and conducting system", importance: "Essential" },
                { topicId: "coronary-circulation", topicName: "Coronary arteries and cardiac veins", importance: "Essential" },
                { topicId: "diaphragm", topicName: "Diaphragm structure and openings", importance: "Foundation" },
                { topicId: "pleura", topicName: "Pleura and pleural recesses", importance: "Foundation" }
              ]
            },

            {
              chapterId: "abdomen-pelvis",
              chapterName: "Abdomen and Pelvis",
              topics: [
                { topicId: "anterior-abdominal-wall", topicName: "Anterior abdominal wall and inguinal canal", importance: "Essential" },
                { topicId: "stomach-anatomy", topicName: "Stomach anatomy and blood supply", importance: "Essential" },
                { topicId: "liver-anatomy", topicName: "Liver anatomy and segments", importance: "Essential" },
                { topicId: "pancreas-spleen", topicName: "Pancreas and spleen", importance: "Foundation" },
                { topicId: "small-large-intestine", topicName: "Small and large intestine anatomy", importance: "Essential" },
                { topicId: "portal-venous-system", topicName: "Portal venous system and portocaval anastomoses", importance: "Essential" },
                { topicId: "kidneys-ureters", topicName: "Kidneys and ureters", importance: "Essential" },
                { topicId: "male-reproductive", topicName: "Male reproductive organs", importance: "Foundation" },
                { topicId: "female-reproductive", topicName: "Female reproductive organs", importance: "Essential" },
                { topicId: "perineum", topicName: "Perineum and ischiorectal fossa", importance: "Foundation" },
                { topicId: "pelvic-diaphragm", topicName: "Pelvic diaphragm", importance: "Standard" }
              ]
            },

            {
              chapterId: "head-neck-face",
              chapterName: "Head, Neck and Face",
              topics: [
                { topicId: "triangles-of-neck", topicName: "Triangles of the neck", importance: "Essential" },
                { topicId: "thyroid-gland", topicName: "Thyroid and parathyroid glands", importance: "Essential" },
                { topicId: "cranial-cavity", topicName: "Cranial cavity and meninges", importance: "Essential" },
                { topicId: "scalp-face", topicName: "Scalp and face structure", importance: "Foundation" },
                { topicId: "muscles-facial-expression", topicName: "Muscles of facial expression", importance: "Foundation" },
                { topicId: "infratemporal-fossa", topicName: "Infratemporal fossa", importance: "Foundation" },
                { topicId: "pterygopalatine-fossa", topicName: "Pterygopalatine fossa", importance: "Standard" },
                { topicId: "oral-cavity-tongue", topicName: "Oral cavity and tongue", importance: "Essential" },
                { topicId: "pharynx-larynx", topicName: "Pharynx and larynx", importance: "Essential" },
                { topicId: "ear-anatomy", topicName: "External, middle and internal ear", importance: "Essential" },
                { topicId: "eye-orbit", topicName: "Orbit and eyeball anatomy", importance: "Essential" }
              ]
            },

            {
              chapterId: "neuroanatomy",
              chapterName: "Neuroanatomy",
              topics: [
                { topicId: "spinal-cord-tracts", topicName: "Spinal cord structure and ascending descending tracts", importance: "Essential" },
                { topicId: "brainstem", topicName: "Brainstem structure and nuclei", importance: "Essential" },
                { topicId: "cerebellum", topicName: "Cerebellum and its connections", importance: "Foundation" },
                { topicId: "diencephalon", topicName: "Thalamus and hypothalamus", importance: "Essential" },
                { topicId: "cerebrum", topicName: "Cerebral cortex and functional areas", importance: "Essential" },
                { topicId: "basal-ganglia", topicName: "Basal ganglia structure and function", importance: "Foundation" },
                { topicId: "limbic-system", topicName: "Limbic system", importance: "Foundation" },
                { topicId: "cranial-nerves", topicName: "Cranial nerves origin and function", importance: "Essential" },
                { topicId: "ventricular-system-csf", topicName: "Ventricular system and CSF circulation", importance: "Foundation" },
                { topicId: "blood-supply-brain", topicName: "Blood supply of brain and circle of Willis", importance: "Essential" }
              ]
            }

          ]
        },

        {
          sectionId: "histology",
          sectionName: "Histology",
          chapters: [

            {
              chapterId: "basic-systemic-histology",
              chapterName: "Basic Tissues and Systemic Slides",
              topics: [
                { topicId: "epithelium-types", topicName: "Epithelium classification and types", importance: "Foundation" },
                { topicId: "connective-tissue", topicName: "Connective tissue types", importance: "Foundation" },
                { topicId: "muscle-histology", topicName: "Muscle histology", importance: "Standard" },
                { topicId: "nervous-tissue", topicName: "Nervous tissue histology", importance: "Foundation" },
                { topicId: "lymphoid-organs", topicName: "Lymphoid organs histology", importance: "Foundation" },
                { topicId: "endocrine-histology", topicName: "Endocrine glands histology", importance: "Essential" },
                { topicId: "gi-tract-histology", topicName: "GI tract histology", importance: "Essential" },
                { topicId: "respiratory-histology", topicName: "Respiratory tract histology", importance: "Foundation" },
                { topicId: "urinary-histology", topicName: "Urinary system histology", importance: "Foundation" },
                { topicId: "reproductive-histology", topicName: "Reproductive system histology", importance: "Standard" }
              ]
            }

          ]
        },

        {
          sectionId: "embryology",
          sectionName: "Embryology",
          chapters: [

            {
              chapterId: "general-organogenesis",
              chapterName: "General and Organogenesis Development",
              topics: [
                { topicId: "gametogenesis", topicName: "Spermatogenesis and oogenesis", importance: "Foundation" },
                { topicId: "fertilization-implantation", topicName: "Fertilization and implantation", importance: "Essential" },
                { topicId: "germ-layer-formation", topicName: "Germ layer formation and gastrulation", importance: "Essential" },
                { topicId: "placenta-development", topicName: "Placenta development and functions", importance: "Essential" },
                { topicId: "cardiovascular-development", topicName: "Cardiovascular system development", importance: "Essential" },
                { topicId: "respiratory-development", topicName: "Respiratory system development", importance: "Foundation" },
                { topicId: "gi-development", topicName: "GI tract development", importance: "Foundation" },
                { topicId: "urogenital-development", topicName: "Urogenital system development", importance: "Foundation" },
                { topicId: "nervous-system-development", topicName: "Nervous system development", importance: "Essential" },
                { topicId: "pharyngeal-arches", topicName: "Pharyngeal arches and pouches", importance: "Essential" },
                { topicId: "congenital-anomalies", topicName: "Common congenital anomalies", importance: "Essential" }
              ]
            }

          ]
        }

      ]
    },

    /* ─────────────────────────────────────
       SUBJECT: PHYSIOLOGY
    ───────────────────────────────────── */
    {
      subjectId: "physiology",
      subjectName: "Physiology",
      sections: [

        {
          sectionId: "general-nerve-muscle",
          sectionName: "General and Nerve-Muscle Physiology",
          chapters: [

            {
              chapterId: "cell-membrane-biophysics",
              chapterName: "Cell and Membrane Biophysics",
              topics: [
                { topicId: "cell-membrane-transport", topicName: "Cell membrane and transport mechanisms", importance: "Essential" },
                { topicId: "resting-membrane-potential", topicName: "Resting membrane potential", importance: "Essential" },
                { topicId: "action-potential", topicName: "Action potential generation and propagation", importance: "Essential" },
                { topicId: "neuromuscular-junction", topicName: "Neuromuscular junction transmission", importance: "Essential" },
                { topicId: "skeletal-muscle-contraction", topicName: "Skeletal muscle contraction mechanism", importance: "Essential" },
                { topicId: "smooth-muscle-physiology", topicName: "Smooth muscle physiology", importance: "Foundation" },
                { topicId: "body-fluids-compartments", topicName: "Body fluids and compartments", importance: "Foundation" }
              ]
            }

          ]
        },

        {
          sectionId: "systemic-physiology",
          sectionName: "Systemic Physiology",
          chapters: [

            {
              chapterId: "blood-hematology",
              chapterName: "Blood and Hematology",
              topics: [
                { topicId: "composition-of-blood", topicName: "Composition and functions of blood", importance: "Foundation" },
                { topicId: "erythropoiesis", topicName: "Erythropoiesis and regulation", importance: "Essential" },
                { topicId: "wbc-functions", topicName: "WBCs types and functions", importance: "Foundation" },
                { topicId: "hemostasis-coagulation", topicName: "Hemostasis and coagulation", importance: "Essential" },
                { topicId: "blood-groups", topicName: "Blood groups and transfusion", importance: "Essential" },
                { topicId: "anemia-classification", topicName: "Anemia classification and pathophysiology", importance: "Essential" }
              ]
            },

            {
              chapterId: "cardiovascular-system",
              chapterName: "Cardiovascular System",
              topics: [
                { topicId: "cardiac-cycle", topicName: "Cardiac cycle phases", importance: "Essential" },
                { topicId: "heart-sounds", topicName: "Heart sounds and murmurs", importance: "Essential" },
                { topicId: "ecg-basics", topicName: "ECG basics and waves", importance: "Essential" },
                { topicId: "cardiac-output-regulation", topicName: "Cardiac output and its regulation", importance: "Essential" },
                { topicId: "blood-pressure-regulation", topicName: "Blood pressure regulation", importance: "Essential" },
                { topicId: "regional-circulation", topicName: "Regional circulations", importance: "Foundation" },
                { topicId: "shock-physiology", topicName: "Circulatory shock", importance: "Essential" }
              ]
            },

            {
              chapterId: "respiratory-system",
              chapterName: "Respiratory System",
              topics: [
                { topicId: "mechanics-of-breathing", topicName: "Mechanics of breathing", importance: "Essential" },
                { topicId: "lung-volumes-capacities", topicName: "Lung volumes and capacities", importance: "Essential" },
                { topicId: "gas-exchange", topicName: "Gas exchange and diffusion", importance: "Essential" },
                { topicId: "oxygen-transport", topicName: "Oxygen transport and dissociation curve", importance: "Essential" },
                { topicId: "co2-transport", topicName: "CO2 transport in blood", importance: "Foundation" },
                { topicId: "regulation-of-respiration", topicName: "Regulation of respiration", importance: "Essential" },
                { topicId: "hypoxia-cyanosis", topicName: "Hypoxia and cyanosis", importance: "Foundation" }
              ]
            },

            {
              chapterId: "gastrointestinal-system",
              chapterName: "Gastrointestinal System",
              topics: [
                { topicId: "salivary-secretion", topicName: "Salivary secretion and regulation", importance: "Foundation" },
                { topicId: "gastric-secretion", topicName: "Gastric secretion and regulation", importance: "Essential" },
                { topicId: "pancreatic-secretion", topicName: "Pancreatic secretion", importance: "Essential" },
                { topicId: "bile-secretion", topicName: "Bile secretion and enterohepatic circulation", importance: "Essential" },
                { topicId: "small-intestine-functions", topicName: "Small intestine digestion and absorption", importance: "Essential" },
                { topicId: "gi-motility", topicName: "GI motility patterns", importance: "Foundation" }
              ]
            },

            {
              chapterId: "renal-system",
              chapterName: "Renal System",
              topics: [
                { topicId: "gfr-filtration", topicName: "Glomerular filtration and GFR", importance: "Essential" },
                { topicId: "tubular-functions", topicName: "Tubular reabsorption and secretion", importance: "Essential" },
                { topicId: "urine-concentration", topicName: "Urine concentration mechanism", importance: "Essential" },
                { topicId: "acid-base-balance", topicName: "Acid-base balance", importance: "Essential" },
                { topicId: "renin-angiotensin", topicName: "Renin-angiotensin-aldosterone system", importance: "Essential" },
                { topicId: "micturition", topicName: "Micturition reflex", importance: "Foundation" }
              ]
            },

            {
              chapterId: "endocrine-reproductive",
              chapterName: "Endocrine and Reproductive Systems",
              topics: [
                { topicId: "hypothalamic-pituitary-axis", topicName: "Hypothalamic-pituitary axis", importance: "Essential" },
                { topicId: "thyroid-physiology", topicName: "Thyroid hormones and disorders", importance: "Essential" },
                { topicId: "adrenal-cortex-medulla", topicName: "Adrenal cortex and medulla", importance: "Essential" },
                { topicId: "endocrine-pancreas", topicName: "Insulin and glucagon physiology", importance: "Essential" },
                { topicId: "calcium-regulation", topicName: "Calcium and phosphate regulation", importance: "Essential" },
                { topicId: "male-reproductive-physiology", topicName: "Male reproductive physiology", importance: "Foundation" },
                { topicId: "female-reproductive-physiology", topicName: "Female reproductive physiology and menstrual cycle", importance: "Essential" },
                { topicId: "pregnancy-lactation", topicName: "Pregnancy and lactation", importance: "Foundation" }
              ]
            },

            {
              chapterId: "cns-special-senses",
              chapterName: "Central Nervous System and Special Senses",
              topics: [
                { topicId: "synaptic-transmission", topicName: "Synaptic transmission and neurotransmitters", importance: "Essential" },
                { topicId: "ascending-descending-tracts", topicName: "Ascending and descending tracts function", importance: "Essential" },
                { topicId: "reflexes", topicName: "Reflexes and their classification", importance: "Foundation" },
                { topicId: "sleep-eeg", topicName: "Sleep stages and EEG", importance: "Foundation" },
                { topicId: "higher-functions", topicName: "Higher cortical functions", importance: "Foundation" },
                { topicId: "vision-physiology", topicName: "Physiology of vision", importance: "Essential" },
                { topicId: "hearing-physiology", topicName: "Physiology of hearing", importance: "Essential" },
                { topicId: "taste-smell", topicName: "Taste and smell", importance: "Standard" }
              ]
            }

          ]
        }

      ]
    },

    /* ─────────────────────────────────────
       SUBJECT: BIOCHEMISTRY
    ───────────────────────────────────── */
    {
      subjectId: "biochemistry",
      subjectName: "Biochemistry",
      sections: [

        {
          sectionId: "basic-biochem-enzymes",
          sectionName: "Basic Biochemistry and Enzymes",
          chapters: [

            {
              chapterId: "biomolecules-kinetics",
              chapterName: "Biomolecules and Kinetics",
              topics: [
                { topicId: "carbohydrate-chemistry", topicName: "Carbohydrate chemistry and classification", importance: "Foundation" },
                { topicId: "lipid-chemistry", topicName: "Lipid chemistry and classification", importance: "Foundation" },
                { topicId: "amino-acid-chemistry", topicName: "Amino acids and protein structure", importance: "Essential" },
                { topicId: "enzyme-classification", topicName: "Enzyme classification and properties", importance: "Foundation" },
                { topicId: "enzyme-kinetics", topicName: "Enzyme kinetics and Michaelis-Menten", importance: "Essential" },
                { topicId: "enzyme-inhibition", topicName: "Enzyme inhibition types", importance: "Essential" },
                { topicId: "coenzymes-cofactors", topicName: "Coenzymes and cofactors", importance: "Foundation" }
              ]
            }

          ]
        },

        {
          sectionId: "metabolism",
          sectionName: "Metabolism",
          chapters: [

            {
              chapterId: "carbohydrate-metabolism",
              chapterName: "Carbohydrate Metabolism",
              topics: [
                { topicId: "glycolysis", topicName: "Glycolysis pathway and regulation", importance: "Essential" },
                { topicId: "tca-cycle", topicName: "TCA cycle and energetics", importance: "Essential" },
                { topicId: "gluconeogenesis", topicName: "Gluconeogenesis and regulation", importance: "Essential" },
                { topicId: "glycogen-metabolism", topicName: "Glycogenesis and glycogenolysis", importance: "Essential" },
                { topicId: "hmp-pathway", topicName: "HMP shunt pathway and significance", importance: "Essential" },
                { topicId: "blood-glucose-regulation", topicName: "Blood glucose regulation", importance: "Essential" },
                { topicId: "diabetes-biochemistry", topicName: "Diabetes mellitus biochemistry", importance: "Essential" }
              ]
            },

            {
              chapterId: "lipid-metabolism",
              chapterName: "Lipid Metabolism",
              topics: [
                { topicId: "fatty-acid-oxidation", topicName: "Beta oxidation of fatty acids", importance: "Essential" },
                { topicId: "fatty-acid-synthesis", topicName: "Fatty acid synthesis", importance: "Essential" },
                { topicId: "ketone-body-metabolism", topicName: "Ketone body formation and utilization", importance: "Essential" },
                { topicId: "cholesterol-metabolism", topicName: "Cholesterol synthesis and regulation", importance: "Essential" },
                { topicId: "lipoprotein-metabolism", topicName: "Lipoprotein metabolism and dyslipidemias", importance: "Essential" },
                { topicId: "phospholipid-metabolism", topicName: "Phospholipid metabolism", importance: "Standard" }
              ]
            },

            {
              chapterId: "protein-aminoacid-metabolism",
              chapterName: "Protein and Amino Acid Metabolism",
              topics: [
                { topicId: "transamination-deamination", topicName: "Transamination and deamination", importance: "Essential" },
                { topicId: "urea-cycle", topicName: "Urea cycle and disorders", importance: "Essential" },
                { topicId: "aromatic-amino-acids", topicName: "Aromatic amino acid metabolism", importance: "Essential" },
                { topicId: "sulfur-amino-acids", topicName: "Sulfur containing amino acid metabolism", importance: "Foundation" },
                { topicId: "specialized-products", topicName: "Specialized products from amino acids", importance: "Foundation" },
                { topicId: "inborn-errors-amino-acid", topicName: "Inborn errors of amino acid metabolism", importance: "Essential" }
              ]
            },

            {
              chapterId: "biological-oxidation-purines",
              chapterName: "Biological Oxidation and Purines",
              topics: [
                { topicId: "electron-transport-chain", topicName: "Electron transport chain and oxidative phosphorylation", importance: "Essential" },
                { topicId: "purine-metabolism", topicName: "Purine metabolism and disorders", importance: "Essential" },
                { topicId: "pyrimidine-metabolism", topicName: "Pyrimidine metabolism", importance: "Foundation" },
                { topicId: "free-radicals", topicName: "Free radicals and antioxidants", importance: "Foundation" }
              ]
            }

          ]
        },

        {
          sectionId: "molecular-biology",
          sectionName: "Molecular Biology",
          chapters: [

            {
              chapterId: "genetics-dna-technology",
              chapterName: "Genetics and DNA Technology",
              topics: [
                { topicId: "dna-structure-replication", topicName: "DNA structure and replication", importance: "Essential" },
                { topicId: "transcription", topicName: "RNA transcription and processing", importance: "Essential" },
                { topicId: "translation-protein-synthesis", topicName: "Translation and protein synthesis", importance: "Essential" },
                { topicId: "gene-regulation", topicName: "Gene regulation in prokaryotes and eukaryotes", importance: "Foundation" },
                { topicId: "mutations-dna-repair", topicName: "Mutations and DNA repair", importance: "Essential" },
                { topicId: "pcr-technique", topicName: "PCR technique and applications", importance: "Essential" },
                { topicId: "recombinant-dna", topicName: "Recombinant DNA technology", importance: "Foundation" },
                { topicId: "human-genome", topicName: "Human genome and genetic disorders", importance: "Foundation" }
              ]
            }

          ]
        },

        {
          sectionId: "clinical-biochem-nutrition",
          sectionName: "Clinical Biochemistry and Nutrition",
          chapters: [

            {
              chapterId: "vitamins-minerals-systems",
              chapterName: "Vitamins, Minerals and Systems",
              topics: [
                { topicId: "fat-soluble-vitamins", topicName: "Fat soluble vitamins functions and deficiency", importance: "Essential" },
                { topicId: "water-soluble-vitamins", topicName: "Water soluble vitamins functions and deficiency", importance: "Essential" },
                { topicId: "major-minerals", topicName: "Major minerals and trace elements", importance: "Foundation" },
                { topicId: "balanced-diet", topicName: "Balanced diet and recommended dietary allowances", importance: "Foundation" },
                { topicId: "protein-energy-malnutrition", topicName: "Protein energy malnutrition", importance: "Essential" },
                { topicId: "liver-function-tests", topicName: "Liver function tests", importance: "Essential" },
                { topicId: "kidney-function-tests", topicName: "Kidney function tests", importance: "Essential" },
                { topicId: "thyroid-function-tests", topicName: "Thyroid function tests", importance: "Foundation" },
                { topicId: "lipid-profile", topicName: "Lipid profile interpretation", importance: "Foundation" }
              ]
            }

          ]
        }

      ]
    }

  ]
};


/* ═══════════════════════════════════════════
   GLOBAL CURRICULUM REGISTRY
   Add more phases here as they get built.
═══════════════════════════════════════════ */

const CURRICULUM = {
  phase_1: PHASE_1_CURRICULUM
};


/* ═══════════════════════════════════════════
   HELPER FUNCTIONS
═══════════════════════════════════════════ */

/* ───────────────────────────────────────
   loadCurriculum(phase)
   Returns curriculum object for a phase.
─────────────────────────────────────── */
function loadCurriculum(phase) {
  if (!phase) return null;
  return CURRICULUM[phase] || null;
}

/* ───────────────────────────────────────
   getCurriculumTopic(topicId, curriculum)
   Finds a topic anywhere in given curriculum.
   If curriculum not provided, searches all phases.
─────────────────────────────────────── */
function getCurriculumTopic(topicId, curriculum) {

  if (!topicId) return null;

  const phases = curriculum
    ? [curriculum]
    : Object.values(CURRICULUM);

  for (const phase of phases) {
    if (!phase || !phase.subjects) continue;

    for (const subject of phase.subjects) {
      for (const section of subject.sections) {
        for (const chapter of section.chapters) {
          for (const topic of chapter.topics) {
            if (topic.topicId === topicId) {
              return {
                topicId: topic.topicId,
                topicName: topic.topicName,
                importance: topic.importance,
                chapterId: chapter.chapterId,
                chapterName: chapter.chapterName,
                sectionId: section.sectionId,
                sectionName: section.sectionName,
                subjectId: subject.subjectId,
                subjectName: subject.subjectName,
                phaseId: phase.phaseId
              };
            }
          }
        }
      }
    }
  }

  return null;
}

/* ───────────────────────────────────────
   findChapterInCurriculum(chapterId, phase, curriculum)
   Returns chapter object including topics.
─────────────────────────────────────── */
function findChapterInCurriculum(chapterId, phase, curriculum) {

  const phaseCurriculum = curriculum
    ? (curriculum[phase] || curriculum)
    : CURRICULUM[phase];

  if (!phaseCurriculum || !phaseCurriculum.subjects) return null;

  for (const subject of phaseCurriculum.subjects) {
    for (const section of subject.sections) {
      for (const chapter of section.chapters) {
        if (chapter.chapterId === chapterId) {
          return chapter;
        }
      }
    }
  }

  return null;
}

/* ───────────────────────────────────────
   countTopicsInSubject(subjectId, curriculum)
   Used by Health Engine for Coverage calculation.
─────────────────────────────────────── */
function countTopicsInSubject(subjectId, curriculum) {

  let count = 0;

  const phases = curriculum
    ? [curriculum]
    : Object.values(CURRICULUM);

  for (const phase of phases) {
    if (!phase || !phase.subjects) continue;

    for (const subject of phase.subjects) {
      if (subject.subjectId === subjectId) {
        for (const section of subject.sections) {
          for (const chapter of section.chapters) {
            count += chapter.topics.length;
          }
        }
      }
    }
  }

  return count;
}

/* ───────────────────────────────────────
   getAllTopicIdsInPhase(phase, curriculum)
   Used by phase archive logic (C2 fix).
─────────────────────────────────────── */
function getAllTopicIdsInPhase(phase, curriculum) {

  const phaseCurriculum = curriculum
    ? (curriculum[phase] || curriculum)
    : CURRICULUM[phase];

  if (!phaseCurriculum || !phaseCurriculum.subjects) return [];

  const ids = [];

  for (const subject of phaseCurriculum.subjects) {
    for (const section of subject.sections) {
      for (const chapter of section.chapters) {
        for (const topic of chapter.topics) {
          ids.push(topic.topicId);
        }
      }
    }
  }

  return ids;
}

/* ───────────────────────────────────────
   getImportanceWeight(importance)
   Universal importance-to-weight converter.
─────────────────────────────────────── */
function getImportanceWeight(importance) {
  if (importance === "Essential")  return 40;
  if (importance === "Foundation") return 20;
  if (importance === "Standard")   return 10;
  return 10;
}

/* ───────────────────────────────────────
   validateCurriculumUniqueness()
   Verifies all topicIds are unique across all phases.
   Logs result to console for testing.
─────────────────────────────────────── */
function validateCurriculumUniqueness() {

  const seenIds = new Set();
  const duplicates = [];

  for (const phase of Object.values(CURRICULUM)) {
    if (!phase || !phase.subjects) continue;

    for (const subject of phase.subjects) {
      for (const section of subject.sections) {
        for (const chapter of section.chapters) {
          for (const topic of chapter.topics) {
            if (seenIds.has(topic.topicId)) {
              duplicates.push(topic.topicId);
            }
            seenIds.add(topic.topicId);
          }
        }
      }
    }
  }

  if (duplicates.length === 0) {
    console.log("All topic IDs are unique. Total: " + seenIds.size);
    return { valid: true, totalTopics: seenIds.size, duplicates: [] };
  } else {
    console.log("Duplicate topic IDs found:", duplicates);
    return { valid: false, totalTopics: seenIds.size, duplicates: duplicates };
  }
}

/* ───────────────────────────────────────
   getCurriculumStats()
   Returns count of subjects, chapters, topics per phase.
─────────────────────────────────────── */
function getCurriculumStats() {

  const stats = {};

  for (const [phaseId, phase] of Object.entries(CURRICULUM)) {
    if (!phase || !phase.subjects) continue;

    let subjectCount = 0;
    let chapterCount = 0;
    let topicCount = 0;

    for (const subject of phase.subjects) {
      subjectCount += 1;
      for (const section of subject.sections) {
        for (const chapter of section.chapters) {
          chapterCount += 1;
          topicCount += chapter.topics.length;
        }
      }
    }

    stats[phaseId] = {
      phaseName: phase.phaseName,
      subjects: subjectCount,
      chapters: chapterCount,
      topics: topicCount
    };
  }

  return stats;
}
