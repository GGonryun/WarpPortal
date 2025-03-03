package services

import (
	"context"
	"fmt"

	"packages/kafra/settings"

	"github.com/redis/go-redis/v9"
)

func ProactiveListener(command string) {
	switch command {
	case "start":
		startProactiveListener()
	default:
		fmt.Printf("Unknown command for ProactiveListener: %s\n", command)
	}
}

func startProactiveListener() {
	fmt.Println("Listening to Redis")
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr: settings.REDIS_ADDRESS,
	})

	pubsub := rdb.Subscribe(ctx, settings.REDIS_CHANNEL_ID)

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
