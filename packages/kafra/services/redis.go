package services

import (
	"context"
	"fmt"

	"packages/kafra/settings"

	"github.com/redis/go-redis/v9"
)

type ProactiveService struct {
	config settings.Config
	logger settings.FileLogger
}

func NewProactiveService(config settings.Config) *ProactiveService {
	return &ProactiveService{
		config: config,
		logger: settings.NewFileLogger(config),
	}
}

func (p *ProactiveService) Run(command string) {
	switch command {
	case "start":
		p.startProactiveListener()
	default:
		fmt.Printf("Unknown command for ProactiveListener: %s\n", command)
	}
}

func (p *ProactiveService) startProactiveListener() {
	fmt.Println("Listening to Redis")
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr: p.config.RedisAddress,
	})

	pubsub := rdb.Subscribe(ctx, p.config.RedisChannelId)

	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		fmt.Printf("Received message: %s\n", msg.Payload)
		if msg.Payload == "echo" {
			fmt.Println("Echoing message")
			err := execCommand([]string{"echo", "Hello, World!"})
			if err != nil {
				fmt.Println("Error echoing message:", err)
			}
		}
	}
}
