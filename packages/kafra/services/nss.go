package services

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// NSS struct to hold service URL
type NSS struct {
	ServiceURL string
}

func (n *NSS) fetchFromProntera(endpoint string, c *gin.Context, result interface{}) error {
	url := fmt.Sprintf("%s/%s?%s", n.ServiceURL, endpoint, c.Request.URL.RawQuery)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	return json.NewDecoder(resp.Body).Decode(result)
}

func (n *NSS) getPasswd(c *gin.Context) {
	var passwdData any
	if err := n.fetchFromProntera("passwd", c, &passwdData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, passwdData)
}

func (n *NSS) getGroup(c *gin.Context) {
	var groupData any
	if err := n.fetchFromProntera("group", c, &groupData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, groupData)
}

func (n *NSS) getShadow(c *gin.Context) {
	var shadowData any
	if err := n.fetchFromProntera("shadow", c, &shadowData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, shadowData)
}

func startNameServiceSwitchProxy() {
	nss := NSS{ServiceURL: getEnvironment("PRONTERA_URL", "http://localhost:3333")}
	r := gin.Default()
	gin.SetMode(gin.DebugMode)

	r.GET("/passwd", nss.getPasswd)
	r.GET("/group", nss.getGroup)
	r.GET("/shadow", nss.getShadow)

	r.Run("localhost:9669")
}

func NameServiceSwitchProxy(command string) {
	switch command {
	case "start":
		startNameServiceSwitchProxy()
	default:
		fmt.Printf("Unknown command for NameServiceSwitchProxy: %s\n", command)
	}
}
