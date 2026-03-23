CREATE TABLE IF NOT EXISTS horde_chat (
  id BIGSERIAL PRIMARY KEY,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO horde_chat (author, text, created_at) VALUES
  ('ВождьОрды', 'Приветствую всех воинов! Орда непобедима! ⚔️', NOW() - INTERVAL '2 hours'),
  ('ЧёрныйВолк', 'Готов к бою! Кто идёт на рейд?', NOW() - INTERVAL '1 hour 45 minutes'),
  ('СтальнойКулак', 'Я в деле! Сегодня захватим новые территории.', NOW() - INTERVAL '1 hour 30 minutes');
