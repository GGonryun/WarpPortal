package settings

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

type Config struct {
	BulletinUrl    string `json:"bulletin_url"`
	LogFilePath    string `json:"log_file_path"`
	RedisAddress   string `json:"redis_address"`
	RedisChannelId string `json:"redis_channel_id"`
}

// copied from kafra
func getEnvironment(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func LoadConfig() (Config, error) {
	configPath := getEnvironment("CONFIG_PATH", "/usr/local/bin/config.json")
	var config Config
	// open the file
	file, err := os.Open(configPath)
	if err != nil {
		return config, err
	}
	defer file.Close()
	// read the file
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&config)
	if err != nil {
		return config, err
	}
	return config, nil

}

type FileLogger struct {
	config Config
}

func NewFileLogger(config Config) FileLogger {
	return FileLogger{config: config}
}

func (l FileLogger) Write(content string) error {
	// create the file and directory if they don't exist
	logDir := l.config.LogFilePath[:len(l.config.LogFilePath)-len("kafra.log")]
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("error creating directory: %w", err)
	}
	// open the file in append mode
	file, err := os.OpenFile(l.config.LogFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("error opening file: %w", err)
	}
	defer file.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")

	entry := fmt.Sprintf("%s: %s", timestamp, content)
	if _, err := file.WriteString(entry); err != nil {
		return fmt.Errorf("error writing to file: %w", err)
	}
	// add a newline at the end
	if _, err := file.WriteString("\n"); err != nil {
		return fmt.Errorf("error writing newline to file: %w", err)
	}
	// flush the file
	if err := file.Sync(); err != nil {
		return fmt.Errorf("error flushing file: %w", err)
	}

	return nil
}
