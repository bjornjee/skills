package main

import (
	"os"
	"path/filepath"
	"time"

	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS daily_usage (
    date               TEXT NOT NULL,
    session_id         TEXT NOT NULL,
    model              TEXT DEFAULT '',
    input_tokens       INTEGER NOT NULL DEFAULT 0,
    output_tokens      INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens  INTEGER NOT NULL DEFAULT 0,
    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd           REAL NOT NULL DEFAULT 0,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (date, session_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_usage(date);
`

// DayCost is a single day's aggregated cost.
type DayCost struct {
	Date    string  `db:"date"`
	CostUSD float64 `db:"cost_usd"`
}

// DB wraps sqlx.DB with repository methods for usage tracking.
type DB struct {
	conn *sqlx.DB
}

// DefaultDBPath returns ~/.claude/agent-dashboard/usage.db.
func DefaultDBPath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "/tmp/agent-dashboard/usage.db"
	}
	return filepath.Join(home, ".claude", "agent-dashboard", "usage.db")
}

// OpenDB opens (or creates) the SQLite database and runs migrations.
func OpenDB(path string) (*DB, error) {
	if path != ":memory:" {
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			return nil, err
		}
	}

	conn, err := sqlx.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	// WAL mode for better concurrent read/write performance
	conn.MustExec("PRAGMA journal_mode=WAL")
	conn.MustExec(schema)

	return &DB{conn: conn}, nil
}

// Close closes the database connection.
func (db *DB) Close() error {
	return db.conn.Close()
}

// UpsertUsage inserts or replaces a daily usage row for a session.
func (db *DB) UpsertUsage(date, sessionID, model string, u Usage) error {
	_, err := db.conn.Exec(`
		INSERT OR REPLACE INTO daily_usage
			(date, session_id, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		date, sessionID, model,
		u.InputTokens, u.OutputTokens, u.CacheReadTokens, u.CacheWriteTokens,
		u.CostUSD, time.Now().UTC().Format(time.RFC3339),
	)
	return err
}

// TotalCost returns the all-time sum of cost_usd across all sessions and days.
func (db *DB) TotalCost() float64 {
	var total float64
	_ = db.conn.Get(&total, "SELECT COALESCE(SUM(cost_usd), 0) FROM daily_usage")
	return total
}

// SessionCostExcludingDate returns the total cost stored for a session across all days except the given date.
func (db *DB) SessionCostExcludingDate(sessionID, excludeDate string) (float64, error) {
	var total float64
	err := db.conn.Get(&total, `
		SELECT COALESCE(SUM(cost_usd), 0) FROM daily_usage
		WHERE session_id = ? AND date != ?`,
		sessionID, excludeDate,
	)
	return total, err
}

// CostForDate returns the total cost across all sessions for a specific date.
func (db *DB) CostForDate(date string) float64 {
	var total float64
	_ = db.conn.Get(&total, `
		SELECT COALESCE(SUM(cost_usd), 0) FROM daily_usage WHERE date = ?`, date)
	return total
}

// CostByDay returns daily aggregated cost since the given time, ordered by date.
func (db *DB) CostByDay(since time.Time) []DayCost {
	var days []DayCost
	_ = db.conn.Select(&days, `
		SELECT date, SUM(cost_usd) as cost_usd
		FROM daily_usage
		WHERE date >= ?
		GROUP BY date
		ORDER BY date`,
		since.Format("2006-01-02"),
	)
	return days
}
