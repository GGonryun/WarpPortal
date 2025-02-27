package services

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PasswdEntry struct {
	PwName   string `json:"pw_name"`
	PwPasswd string `json:"pw_passwd"`
	PwUID    int    `json:"pw_uid"`
	PwGID    int    `json:"pw_gid"`
	PwGecos  string `json:"pw_gecos"`
	PwDir    string `json:"pw_dir"`
	PwShell  string `json:"pw_shell"`
}

type GroupEntry struct {
	GrName   string   `json:"gr_name"`
	GrPasswd string   `json:"gr_passwd"`
	GrGID    int      `json:"gr_gid"`
	GrMem    []string `json:"gr_mem"`
}

type ShadowEntry struct {
	SpNamp   string `json:"sp_namp"`
	SpPwdp   string `json:"sp_pwdp"`
	SpLstchg int    `json:"sp_lstchg"`
	SpMin    int    `json:"sp_min"`
	SpMax    int    `json:"sp_max"`
	SpWarn   int    `json:"sp_warn"`
	SpInact  *int   `json:"sp_inact"`
	SpExpire *int   `json:"sp_expire"`
	SpFlag   *int   `json:"sp_flag"`
}

var passwdData = []PasswdEntry{
	{"testuser1", "x", 6000, 6000, "Testing", "/home/testuser1", "/bin/bash"},
	{"testuser2", "x", 6001, 6000, "", "/home/testuser2", "/bin/bash"},
	{"testuser3", "x", 6002, 6001, "", "/home/testuser3", "/bin/bash"},
	{"testuser4", "x", 6003, 6001, "", "/home/testuser4", "/bin/bash"},
}

var groupData = []GroupEntry{
	{"testgroup1", "x", 6000, []string{"testuser1", "testuser2"}},
	{"testgroup2", "x", 6001, []string{"testuser3", "testuser4"}},
}

var shadowData = []ShadowEntry{
	{"testuser1", "$1$BXZIu72k$S7oxt9hBiBl/O3Rm3H4Q30", 16034, 0, 99999, 7, nil, nil, nil},
	{"testuser2", "$1$BXZIu72k$S7oxt9hBiBl/O3Rm3H4Q30", 16034, 0, 99999, 7, nil, nil, nil},
	{"testuser3", "$1$BXZIu72k$S7oxt9hBiBl/O3Rm3H4Q30", 16034, 0, 99999, 7, nil, nil, nil},
	{"testuser4", "$1$BXZIu72k$S7oxt9hBiBl/O3Rm3H4Q30", 16034, 0, 99999, 7, ptr(10), ptr(50), nil},
}

func ptr(i int) *int { return &i }

func getPasswd(c *gin.Context) {
	name := c.Query("name")
	uid := c.Query("uid")

	if name != "" {
		for _, entry := range passwdData {
			if entry.PwName == name {
				c.JSON(http.StatusOK, entry)
				return
			}
		}
		c.Status(http.StatusNotFound)
		return
	}

	if uid != "" {
		for _, entry := range passwdData {
			if jsonValue, _ := json.Marshal(entry.PwUID); string(jsonValue) == uid {
				c.JSON(http.StatusOK, entry)
				return
			}
		}
		c.Status(http.StatusNotFound)
		return
	}

	c.JSON(http.StatusOK, passwdData)
}

func getGroup(c *gin.Context) {
	name := c.Query("name")
	gid := c.Query("gid")

	if name != "" {
		for _, entry := range groupData {
			if entry.GrName == name {
				c.JSON(http.StatusOK, entry)
				return
			}
		}
		c.Status(http.StatusNotFound)
		return
	}

	if gid != "" {
		for _, entry := range groupData {
			if jsonValue, _ := json.Marshal(entry.GrGID); string(jsonValue) == gid {
				c.JSON(http.StatusOK, entry)
				return
			}
		}
		c.Status(http.StatusNotFound)
		return
	}

	c.JSON(http.StatusOK, groupData)
}

func getShadow(c *gin.Context) {
	name := c.Query("name")

	if name != "" {
		for _, entry := range shadowData {
			if entry.SpNamp == name {
				c.JSON(http.StatusOK, entry)
				return
			}
		}
		c.Status(http.StatusNotFound)
		return
	}

	c.JSON(http.StatusOK, shadowData)
}

func startNameServiceSwitchProxy() {
	r := gin.Default()
	r.GET("/passwd", getPasswd)
	r.GET("/group", getGroup)
	r.GET("/shadow", getShadow)

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
