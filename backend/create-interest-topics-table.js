const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Creando tabla users_interest_topics...\n');

db.serialize(() => {
  // Crear la tabla de relación many-to-many
  db.run(`
    CREATE TABLE IF NOT EXISTS users_interest_topics (
      user_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      PRIMARY KEY (user_id, topic_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error al crear la tabla:', err);
    } else {
      console.log('✅ Tabla users_interest_topics creada exitosamente');
    }

    db.close(() => {
      console.log('\n🎉 Migración completada!');
    });
  });
});
