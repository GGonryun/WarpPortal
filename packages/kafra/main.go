package main

import (
	"flag"
	"fmt"
	"packages/kafra/services"
)

func main() {
	flag.Parse()

	if len(flag.Args()) < 2 {
		fmt.Println("Usage: kafra <service> <command>")
		return
	}

	service := flag.Arg(0)
	command := flag.Arg(1)

	switch service {
	case "warp":
		services.ProactiveListener(command)
	case "nss":
		services.NameServiceSwitchProxy(command)
	case "session":
		services.SessionProcessor(command)
	default:
		fmt.Printf("Unknown service: %s\n", service)
	}
}
