package services

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"github.com/redis/go-redis/v9"
)

func StartProactiveListener() {
	fmt.Println("Listening to Redis")
	ctx := context.Background()

	addr := getEnvironment("REDIS_ADDRESS", "localhost:6379")
	channel := getEnvironment("CHANNEL_ID", "kafra")

	rdb := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	pubsub := rdb.Subscribe(ctx, channel)

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

func execCommand(command []string) error {
	cmd := exec.Command(command[0], command[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	return err
}
