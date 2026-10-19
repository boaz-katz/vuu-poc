CREATE TABLE students (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 0 AND 130)
);

CREATE TABLE classes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  student_ids INTEGER[] NOT NULL DEFAULT '{}'
);

INSERT INTO students (name, phone_number, age) VALUES
  ('Ava Cohen', '+972-50-555-0101', 20),
  ('Noah Levy', '+972-50-555-0102', 21),
  ('Mia Ben-David', '+972-50-555-0103', 19),
  ('Liam Mizrahi', '+972-50-555-0104', 22),
  ('Ella Peretz', '+972-50-555-0105', 20);

INSERT INTO classes (name, student_ids) VALUES
  ('Mathematics', ARRAY[1, 2, 3]),
  ('Computer Science', ARRAY[1, 3, 4, 5]),
  ('English Literature', ARRAY[2, 4]);
