-- ============================================================
-- Flashcards feature setup
-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- ============================================================

-- 1. Tables ---------------------------------------------------

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  topic text not null,
  subtopic text not null,
  front text not null,
  back text not null,
  created_at timestamptz not null default now()
);

create index if not exists flashcards_subject_subtopic_idx
  on public.flashcards (subject, subtopic);

create table if not exists public.flashcard_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.flashcards (id) on delete cascade,
  status text not null check (status in ('known', 'learning')),
  last_seen timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- 2. Row Level Security --------------------------------------

alter table public.flashcards enable row level security;
alter table public.flashcard_progress enable row level security;

-- Everyone signed in can read the shared flashcards catalog
drop policy if exists "flashcards are readable by authenticated users" on public.flashcards;
create policy "flashcards are readable by authenticated users"
  on public.flashcards for select
  to authenticated
  using (true);

-- Users can only read/write their OWN progress rows
drop policy if exists "read own flashcard progress" on public.flashcard_progress;
create policy "read own flashcard progress"
  on public.flashcard_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own flashcard progress" on public.flashcard_progress;
create policy "insert own flashcard progress"
  on public.flashcard_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update own flashcard progress" on public.flashcard_progress;
create policy "update own flashcard progress"
  on public.flashcard_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own flashcard progress" on public.flashcard_progress;
create policy "delete own flashcard progress"
  on public.flashcard_progress for delete
  to authenticated
  using (auth.uid() = user_id);

-- 3. Seed data (safe to re-run: clears + reloads catalog) -----

delete from public.flashcards;

insert into public.flashcards (subject, topic, subtopic, front, back) values
-- Biology :: Cell Structure
('Biology', 'Cell Biology', 'Cell Structure', 'What is the function of the mitochondria?', 'It is the site of aerobic respiration, releasing energy (ATP) for the cell. Often called the powerhouse of the cell.'),
('Biology', 'Cell Biology', 'Cell Structure', 'What controls the movement of substances in and out of the cell?', 'The cell (plasma) membrane, which is partially permeable.'),
('Biology', 'Cell Biology', 'Cell Structure', 'Which organelle contains the cell''s genetic material?', 'The nucleus, which contains DNA and controls cell activities.'),
('Biology', 'Cell Biology', 'Cell Structure', 'Name the site of protein synthesis in a cell.', 'The ribosomes.'),
('Biology', 'Cell Biology', 'Cell Structure', 'What structure gives plant cells their rigid shape?', 'The cell wall, made of cellulose.'),
('Biology', 'Cell Biology', 'Cell Structure', 'What is the role of chloroplasts?', 'They absorb light energy for photosynthesis; they contain chlorophyll.'),
-- Biology :: Genetics
('Biology', 'Genetics and Evolution', 'Genetics', 'What is a gene?', 'A section of DNA that codes for a particular protein / characteristic.'),
('Biology', 'Genetics and Evolution', 'Genetics', 'Define an allele.', 'An alternative form of a gene.'),
('Biology', 'Genetics and Evolution', 'Genetics', 'What does "homozygous" mean?', 'Having two identical alleles for a trait (e.g. TT or tt).'),
('Biology', 'Genetics and Evolution', 'Genetics', 'What is the genotype?', 'The genetic makeup of an organism (the alleles it carries).'),
('Biology', 'Genetics and Evolution', 'Genetics', 'How many chromosomes are in a normal human body cell?', '46 chromosomes (23 pairs).'),
('Biology', 'Genetics and Evolution', 'Genetics', 'What is a dominant allele?', 'An allele that is expressed even when only one copy is present.'),
-- Biology :: Photosynthesis
('Biology', 'Plant Biology', 'Photosynthesis', 'Write the word equation for photosynthesis.', 'Carbon dioxide + water --(light/chlorophyll)--> glucose + oxygen.'),
('Biology', 'Plant Biology', 'Photosynthesis', 'Which pigment absorbs light for photosynthesis?', 'Chlorophyll.'),
('Biology', 'Plant Biology', 'Photosynthesis', 'Where in the plant does most photosynthesis occur?', 'In the palisade mesophyll cells of the leaf.'),
('Biology', 'Plant Biology', 'Photosynthesis', 'Name three factors that affect the rate of photosynthesis.', 'Light intensity, carbon dioxide concentration, and temperature.'),
('Biology', 'Plant Biology', 'Photosynthesis', 'What gas is released during photosynthesis?', 'Oxygen.'),
('Biology', 'Plant Biology', 'Photosynthesis', 'What is the main product of photosynthesis used for energy?', 'Glucose.'),

-- Chemistry :: Atomic Structure
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'What are the three subatomic particles?', 'Protons, neutrons, and electrons.'),
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'What is the charge of a proton?', 'Positive (+1).'),
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'What does the atomic number represent?', 'The number of protons in an atom.'),
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'Define an isotope.', 'Atoms of the same element with the same number of protons but different numbers of neutrons.'),
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'Where are electrons located in an atom?', 'In shells / energy levels around the nucleus.'),
('Chemistry', 'Physical Chemistry', 'Atomic Structure', 'What is the mass number?', 'The total number of protons and neutrons in an atom.'),
-- Chemistry :: Chemical Bonding
('Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'What is an ionic bond?', 'The electrostatic attraction between oppositely charged ions formed by the transfer of electrons.'),
('Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'What is a covalent bond?', 'A bond formed by the sharing of pairs of electrons between atoms.'),
('Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'Which type of bonding occurs in metals?', 'Metallic bonding - a lattice of positive ions in a sea of delocalised electrons.'),
('Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'Why do ionic compounds conduct electricity when molten?', 'Because the ions become free to move and carry charge.'),
('Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'What holds atoms together in a water molecule?', 'Covalent bonds.'),
('Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'Name the force between simple molecules.', 'Weak intermolecular forces (van der Waals forces).'),
-- Chemistry :: Acids and Bases
('Chemistry', 'Physical Chemistry', 'Acids and Bases', 'What ion do all acids produce in water?', 'Hydrogen ions (H+).'),
('Chemistry', 'Physical Chemistry', 'Acids and Bases', 'What is the pH of a neutral solution?', '7.'),
('Chemistry', 'Physical Chemistry', 'Acids and Bases', 'What ion do alkalis produce in water?', 'Hydroxide ions (OH-).'),
('Chemistry', 'Physical Chemistry', 'Acids and Bases', 'What is produced when an acid reacts with a base?', 'A salt and water (neutralisation).'),
('Chemistry', 'Physical Chemistry', 'Acids and Bases', 'What colour is litmus in acid?', 'Red.'),
('Chemistry', 'Physical Chemistry', 'Acids and Bases', 'Name a common laboratory acid.', 'Hydrochloric acid, sulfuric acid, or nitric acid.'),

-- Physics :: Forces and Motion
('Physics', 'Mechanics', 'Forces and Motion', 'State Newton''s first law of motion.', 'An object stays at rest or moves at constant velocity unless acted on by a resultant force.'),
('Physics', 'Mechanics', 'Forces and Motion', 'What is the equation linking force, mass and acceleration?', 'Force = mass x acceleration (F = ma).'),
('Physics', 'Mechanics', 'Forces and Motion', 'Define acceleration.', 'The rate of change of velocity with time.'),
('Physics', 'Mechanics', 'Forces and Motion', 'What is the unit of force?', 'The newton (N).'),
('Physics', 'Mechanics', 'Forces and Motion', 'What is the difference between speed and velocity?', 'Speed is scalar (magnitude only); velocity is a vector (magnitude and direction).'),
('Physics', 'Mechanics', 'Forces and Motion', 'What does a horizontal line on a distance-time graph mean?', 'The object is stationary (not moving).'),
-- Physics :: Electricity
('Physics', 'Electricity and Magnetism', 'Electricity', 'State Ohm''s law.', 'Voltage = current x resistance (V = IR), at constant temperature.'),
('Physics', 'Electricity and Magnetism', 'Electricity', 'What is the unit of electrical resistance?', 'The ohm.'),
('Physics', 'Electricity and Magnetism', 'Electricity', 'What is electric current?', 'The rate of flow of electric charge.'),
('Physics', 'Electricity and Magnetism', 'Electricity', 'In a series circuit, how does current behave?', 'The current is the same at every point in the circuit.'),
('Physics', 'Electricity and Magnetism', 'Electricity', 'What component controls current by varying resistance?', 'A variable resistor (rheostat).'),
('Physics', 'Electricity and Magnetism', 'Electricity', 'What is the unit of electric charge?', 'The coulomb (C).'),
-- Physics :: Waves
('Physics', 'Waves and Optics', 'Waves', 'What is the wave equation?', 'Wave speed = frequency x wavelength (v = f x λ).'),
('Physics', 'Waves and Optics', 'Waves', 'Define frequency.', 'The number of complete waves passing a point per second, measured in hertz (Hz).'),
('Physics', 'Waves and Optics', 'Waves', 'What is the difference between transverse and longitudinal waves?', 'In transverse waves vibrations are perpendicular to travel; in longitudinal they are parallel.'),
('Physics', 'Waves and Optics', 'Waves', 'Give an example of a longitudinal wave.', 'Sound waves.'),
('Physics', 'Waves and Optics', 'Waves', 'What is the amplitude of a wave?', 'The maximum displacement from the rest position.'),
('Physics', 'Waves and Optics', 'Waves', 'What happens to light when it enters a denser medium?', 'It slows down and bends towards the normal (refraction).'),

-- Mathematics :: Algebra
('Mathematics', 'Algebra', 'Algebra Basics', 'Expand: (x + 3)(x + 2).', 'x^2 + 5x + 6.'),
('Mathematics', 'Algebra', 'Algebra Basics', 'Solve: 2x + 5 = 13.', 'x = 4.'),
('Mathematics', 'Algebra', 'Algebra Basics', 'Factorise: x^2 - 9.', '(x - 3)(x + 3) (difference of two squares).'),
('Mathematics', 'Algebra', 'Algebra Basics', 'Make y the subject: 3y - 6 = x.', 'y = (x + 6) / 3.'),
('Mathematics', 'Algebra', 'Algebra Basics', 'What is the gradient in y = 4x + 1?', '4.'),
('Mathematics', 'Algebra', 'Algebra Basics', 'Simplify: 3a + 4a - 2a.', '5a.'),
-- Mathematics :: Geometry
('Mathematics', 'Geometry and Trigonometry', 'Geometry', 'What is the sum of angles in a triangle?', '180 degrees.'),
('Mathematics', 'Geometry and Trigonometry', 'Geometry', 'State Pythagoras'' theorem.', 'a^2 + b^2 = c^2, where c is the hypotenuse of a right-angled triangle.'),
('Mathematics', 'Geometry and Trigonometry', 'Geometry', 'What is the sum of interior angles in a quadrilateral?', '360 degrees.'),
('Mathematics', 'Geometry and Trigonometry', 'Geometry', 'Area of a circle?', 'A = π r^2.'),
('Mathematics', 'Geometry and Trigonometry', 'Geometry', 'What does SOH-CAH-TOA help you recall?', 'The trig ratios: sin = opp/hyp, cos = adj/hyp, tan = opp/adj.'),
('Mathematics', 'Geometry and Trigonometry', 'Geometry', 'How many degrees in a full circle?', '360 degrees.'),
-- Mathematics :: Statistics
('Mathematics', 'Statistics and Probability', 'Statistics', 'How do you calculate the mean?', 'Add all the values and divide by how many values there are.'),
('Mathematics', 'Statistics and Probability', 'Statistics', 'What is the median?', 'The middle value when the data is arranged in order.'),
('Mathematics', 'Statistics and Probability', 'Statistics', 'What is the mode?', 'The value that occurs most frequently.'),
('Mathematics', 'Statistics and Probability', 'Statistics', 'What is the range?', 'The difference between the highest and lowest values.'),
('Mathematics', 'Statistics and Probability', 'Statistics', 'Probability of a certain event?', '1.'),
('Mathematics', 'Statistics and Probability', 'Statistics', 'What is the probability scale range?', 'From 0 (impossible) to 1 (certain).'),

-- English Language :: Parts of Speech
('English Language', 'Lexis and Structure', 'Parts of Speech', 'What is a noun?', 'A word that names a person, place, thing, or idea.'),
('English Language', 'Lexis and Structure', 'Parts of Speech', 'What is a verb?', 'A word that expresses an action or state of being.'),
('English Language', 'Lexis and Structure', 'Parts of Speech', 'What is an adjective?', 'A word that describes or modifies a noun.'),
('English Language', 'Lexis and Structure', 'Parts of Speech', 'What is an adverb?', 'A word that modifies a verb, adjective, or another adverb (often ends in -ly).'),
('English Language', 'Lexis and Structure', 'Parts of Speech', 'What is a pronoun?', 'A word used in place of a noun (e.g. he, she, it, they).'),
('English Language', 'Lexis and Structure', 'Parts of Speech', 'What is a conjunction?', 'A word that joins words, phrases, or clauses (e.g. and, but, because).'),
-- English Language :: Figures of Speech
('English Language', 'Figures of Speech', 'Figures of Speech', 'What is a simile?', 'A comparison using "like" or "as" (e.g. as brave as a lion).'),
('English Language', 'Figures of Speech', 'Figures of Speech', 'What is a metaphor?', 'A direct comparison stating one thing IS another (e.g. time is money).'),
('English Language', 'Figures of Speech', 'Figures of Speech', 'What is personification?', 'Giving human qualities to non-human things (e.g. the wind whispered).'),
('English Language', 'Figures of Speech', 'Figures of Speech', 'What is hyperbole?', 'Deliberate exaggeration for effect (e.g. I have told you a million times).'),
('English Language', 'Figures of Speech', 'Figures of Speech', 'What is onomatopoeia?', 'A word that imitates the sound it describes (e.g. buzz, bang).'),
('English Language', 'Figures of Speech', 'Figures of Speech', 'What is alliteration?', 'Repetition of the same initial consonant sound in nearby words.'),
-- English Language :: Comprehension
('English Language', 'Comprehension', 'Comprehension Skills', 'What is the main idea of a passage?', 'The central point or message the author wants to convey.'),
('English Language', 'Comprehension', 'Comprehension Skills', 'What does "infer" mean in comprehension?', 'To work out meaning that is implied but not directly stated.'),
('English Language', 'Comprehension', 'Comprehension Skills', 'What is a synonym?', 'A word with the same or similar meaning as another word.'),
('English Language', 'Comprehension', 'Comprehension Skills', 'What is an antonym?', 'A word with the opposite meaning of another word.'),
('English Language', 'Comprehension', 'Comprehension Skills', 'What is the tone of a passage?', 'The writer''s attitude or feeling towards the subject.'),
('English Language', 'Comprehension', 'Comprehension Skills', 'What is a topic sentence?', 'The sentence that states the main idea of a paragraph.');

-- Done. The Flashcards feature will now show subjects, subtopics, and cards.
