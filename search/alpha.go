package search

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"text/template"

	"github.com/go-resty/resty"
)

// OrganicResultsSet has top N results from each provider with scores
type OrganicResultsSet struct {
	OR        []OrganicResults // provider:results
	HighScore float64          // provider:highestScore
	Name      string           // ordered string array based on score
}

// OrganicResults is a place holder struct
type OrganicResults struct {
	Position int
	Index    string
	Score    float64
	ID       string
}

// Alpha for threaded searches UI testing
func Alpha(w http.ResponseWriter, r *http.Request) {

	log.Printf("r path: %s\n", r.URL.Query()) // need to log this better so I can filter out search terms later
	queryterm := r.URL.Query().Get("q")
	queryterm = strings.TrimSpace(queryterm) // remove leading and trailing white spaces a user might put in (not internal spaces though)

	// get the start at value or set to 0
	var startAt uint64
	startAt = 0
	if s, err := strconv.Atoi(r.URL.Query().Get("start")); err == nil {
		startAt = uint64(s)
	}

	// indexes := [6]string{"bco-dmo", "linkedearth", "opencore", "csdco", "rwg", "ieda"}
	templateFile := "./templates/alphatemplate.html"

	// parse the queryterm to get the colon based qualifiers
	qstring := parse(queryterm)
	distance := ""

	fmt.Printf("qstring: %s   distance: %s\n", qstring, distance)

	countHolder := 1

	// Set up some metadata on the search results to return
	var searchmeta ResultsMetaData
	searchmeta.Term = queryterm // We don't use qstring.Query here since we want the full string including qualifiers, returned to the page for rendering with results
	searchmeta.Count = uint64(countHolder)
	searchmeta.StartAt = startAt
	searchmeta.EndAt = startAt + 20 // TODO make this a var..   do not set statis!!!!!!
	searchmeta.NextStart = searchmeta.EndAt + 1
	searchmeta.PrevStart = searchmeta.StartAt - 20

	searchmeta.Message = ""

	resp := getByQuery(qstring.Query) // not using the qualifiers at this time
	var orsa []OrganicResultsSet
	if err := json.Unmarshal([]byte(resp), &orsa); err != nil {
		log.Println(err)
	}

	params := paramsBySet()
	log.Println(params)

	ht, err := template.New("Template").ParseFiles(templateFile) //open and parse a template text file
	if err != nil {
		log.Printf("template parse failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "Q", searchmeta) //  Section Q sets the navigation elements
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "T", orsa) // Section T results
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}

}

// try https://github.com/go-resty/resty

// get the initial JSON set of URI based on the
// organic search
func getByQuery(query string) string {
	urlstring := fmt.Sprintf("http://geodex.org/api/v1/textindex/searchset?q=%s&n=20&s=0", query)
	resp, err := resty.R().Get(urlstring)
	if err != nil {
		log.Println(err)
	}

	// fmt.Printf("\nError: %v", err)
	// fmt.Printf("\nResponse Status Code: %v", resp.StatusCode())
	// fmt.Printf("\nResponse Status: %v", resp.Status())
	// fmt.Printf("\nResponse Time: %v", resp.Time())
	// fmt.Printf("\nResponse Received At: %v", resp.ReceivedAt())
	// fmt.Printf("\nResponse Body: %v", resp) // or resp.String() or string(resp.Body())

	return resp.String()
}

func geoJSONBySet() {

}

func paramsBySet() string {
	a := []string{"<https://www.bco-dmo.org/dataset/3300>", "<http://opencoredata.org/id/dataset/bcd15975-680c-47db-a062-ac0bb6e66816>"}
	items, err := json.Marshal(a)
	if err != nil {
		log.Fatal("Cannot encode to JSON ", err)
	}

	resp, err := resty.R().
		SetFormData(map[string]string{
			"body": string(items),
		}).
		Post("http://geodex.org/api/v1/graph/ressetdetails")
	if err != nil {
		log.Print(err)
	}

	return resp.String()
}

func peopleBySet() {

}
