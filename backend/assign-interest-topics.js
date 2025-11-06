const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Asignando temas de interés a usuarios de SIGA...\n');

// Mapeo de programas SIGA a códigos de topics
const programaToTopicCode = {
  'IA': 'INTELIGENCIA_ARTIFICIAL',
  'Inteligencia Artificial': 'INTELIGENCIA_ARTIFICIAL',
  'AD': 'ANALISIS_DATOS',
  'Análisis de Datos': 'ANALISIS_DATOS',
  'Analisis de Datos': 'ANALISIS_DATOS',
  'PRO': 'PROGRAMACION',
  'Programación': 'PROGRAMACION',
  'Programacion': 'PROGRAMACION',
};

db.serialize(() => {
  // Obtener todos los topics
  db.all('SELECT id, codigo, nombre FROM topics', [], (err, topics) => {
    if (err) {
      console.error('Error al obtener topics:', err);
      db.close();
      return;
    }

    const topicMap = {};
    topics.forEach(t => {
      topicMap[t.codigo] = t.id;
    });

    console.log('📚 Topics disponibles:');
    topics.forEach(t => console.log(`   - ${t.nombre} (${t.codigo})`));
    console.log('');

    // Obtener todos los usuarios de SIGA
    db.all(
      "SELECT id, nombres, apellidos, siga_preinscripcion_id FROM users WHERE source = 'SIGA'",
      [],
      (err, users) => {
        if (err) {
          console.error('Error al obtener usuarios:', err);
          db.close();
          return;
        }

        console.log(`👥 Encontrados ${users.length} usuarios de SIGA\n`);

        let processed = 0;
        let assigned = 0;

        users.forEach((user, index) => {
          // Obtener el programa de interés desde SIGA
          db.get(
            `SELECT programa_interes FROM siga_preinscriptions WHERE id = ?`,
            [user.siga_preinscripcion_id],
            (err, sigaData) => {
              processed++;

              if (err || !sigaData) {
                console.log(`⚠️  ${user.nombres} ${user.apellidos}: No se encontró información de SIGA`);
              } else {
                const programa = sigaData.programa_interes;
                const topicCode = programaToTopicCode[programa];

                if (!topicCode || !topicMap[topicCode]) {
                  console.log(`⚠️  ${user.nombres} ${user.apellidos}: Programa "${programa}" no mapeado`);
                } else {
                  const topicId = topicMap[topicCode];

                  // Verificar si ya tiene el tema asignado
                  db.get(
                    'SELECT * FROM users_interest_topics WHERE user_id = ? AND topic_id = ?',
                    [user.id, topicId],
                    (err, existing) => {
                      if (existing) {
                        console.log(`✅ ${user.nombres} ${user.apellidos}: Ya tiene "${topicCode}" asignado`);
                      } else {
                        // Insertar el tema de interés
                        db.run(
                          'INSERT INTO users_interest_topics (user_id, topic_id) VALUES (?, ?)',
                          [user.id, topicId],
                          (err) => {
                            if (err) {
                              console.log(`❌ ${user.nombres} ${user.apellidos}: Error al asignar tema`);
                            } else {
                              assigned++;
                              console.log(`✅ ${user.nombres} ${user.apellidos}: Asignado "${topicCode}"`);
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }

              // Cerrar base de datos cuando terminen todos
              if (processed === users.length) {
                setTimeout(() => {
                  console.log(`\n🎉 Proceso completado: ${assigned} temas asignados`);
                  db.close();
                }, 1000);
              }
            }
          );
        });

        if (users.length === 0) {
          console.log('No hay usuarios de SIGA para procesar');
          db.close();
        }
      }
    );
  });
});
