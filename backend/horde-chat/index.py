"""
Чат альянса ОРДА — получение и отправка сообщений
GET  / — последние 100 сообщений
POST / — отправить новое сообщение
DELETE /?id=<id> — удалить сообщение (только для главы)
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, author, text, created_at FROM horde_chat ORDER BY created_at ASC LIMIT 100"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        messages = [
            {
                "id": r[0],
                "author": r[1],
                "text": r[2],
                "time": r[3].strftime("%H:%M"),
                "created_at": r[3].isoformat(),
            }
            for r in rows
        ]
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"messages": messages}, ensure_ascii=False),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        author = (body.get("author") or "Воин").strip()[:50]
        text = (body.get("text") or "").strip()[:1000]
        if not text:
            return {
                "statusCode": 400,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Пустое сообщение"}),
            }
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO horde_chat (author, text) VALUES (%s, %s) RETURNING id, created_at",
            (author, text),
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "id": row[0],
                    "author": author,
                    "text": text,
                    "time": row[1].strftime("%H:%M"),
                    "created_at": row[1].isoformat(),
                },
                ensure_ascii=False,
            ),
        }

    if method == "DELETE":
        params = event.get("queryStringParameters") or {}
        msg_id = params.get("id")
        if not msg_id:
            return {
                "statusCode": 400,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "Не указан id"}),
            }
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM horde_chat WHERE id = %s", (int(msg_id),))
        conn.commit()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True}),
        }

    return {
        "statusCode": 405,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": "Method not allowed"}),
    }
