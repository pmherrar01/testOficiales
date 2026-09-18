-- Esquema de base de datos para el examen de Oficiales de Mesa de Baloncesto
CREATE DATABASE IF NOT EXISTS baloncesto_examen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE baloncesto_examen;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_text TEXT NOT NULL,
  option_a VARCHAR(600) NOT NULL,
  option_b VARCHAR(600) NOT NULL,
  option_c VARCHAR(600) DEFAULT NULL,
  option_d VARCHAR(600) DEFAULT NULL,
  correct_option CHAR(1) NOT NULL,
  reference VARCHAR(255) DEFAULT '',
  category VARCHAR(120) DEFAULT '',
  difficulty ENUM('facil', 'media', 'dificil') NOT NULL DEFAULT 'media',
  source VARCHAR(50) DEFAULT 'oficiales',
  source_page INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mode ENUM('normal', 'fallos') NOT NULL DEFAULT 'normal',
  num_questions INT NOT NULL,
  score INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_id INT NOT NULL,
  position INT NOT NULL,
  option_order VARCHAR(10) NOT NULL,
  selected_option CHAR(1) DEFAULT NULL,
  is_correct TINYINT(1) DEFAULT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS failed_questions (
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  fail_count INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, question_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;
