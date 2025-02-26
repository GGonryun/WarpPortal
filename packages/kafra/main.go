package main

import (
	"packages/kafra/services"
)

func main() {
	go services.StartProactiveListener()
	services.StartNameServiceSwitchProxy()
}
