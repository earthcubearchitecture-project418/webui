package search

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"text/template"

	"github.com/go-resty/resty"
)

// OrganicResultsSet has top N results from each provider with scores
type OrganicResultsSet struct {
	OR        []OrganicResults // provider:results
	HighScore float64          // provider:highestScore
	Index     string           // ordered string array based on score
	PS        []ParamSet
	PPLS      []PersonSet
	GJ        string
}

// OrganicResults is a place holder struct
type OrganicResults struct {
	Position  int     `json:"position"`
	IndexPath string  `json:"indexpath"`
	Score     float64 `json:"score"`
	ID        string  `json:"URL"`
	ReverseID string  `json:"reverseURL"`
}

// ParamSet is the set of parameters associated with the result set
type ParamSet struct {
	Val     string
	Desc    string
	PubName string
	PubURL  string
}

// PersonSet is the set of people associated with a result set
type PersonSet struct {
	G        string
	Person   string
	Rolename string
	Name     string
	URL      string
	Orcid    string
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
	// templateFile := "./templates/alphatemplate.html"
	templateFile := "./templates/alphatemplatev2.html"

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

	// get the resources
	resp := getByQuery(qstring.Query, startAt) // not using the qualifiers at this time
	var orsa []OrganicResultsSet
	if err := json.Unmarshal([]byte(resp), &orsa); err != nil {
		log.Println(err)
	}

	// loop on orsa..  and sent the or array to each query to populate the params, people and geojson then for it...
	// find prams based on resource set
	for item := range orsa {
		or := orsa[item].OR // just want the string array of ID's  (make a small function for this)  resAsJSON()

		// Add reverse URL to the struct
		for entry := range or {
			or[entry].ReverseID = reverseURL(or[entry].ID)
		}

		params := paramsBySet(resAsJSON(or))
		var p []ParamSet
		if err := json.Unmarshal([]byte(params), &p); err != nil {
			log.Println(err)
		}
		orsa[item].PS = p

		people := peopleBySet(resAsJSON(or))
		var ppl []PersonSet
		if err := json.Unmarshal([]byte(people), &ppl); err != nil {
			log.Println(err)
		}
		orsa[item].PPLS = ppl

		gj := geoJSONBySet(resAsJSON(or))
		orsa[item].GJ = gj

		log.Println(item)
		log.Println(gj)
	}

	ht, err := template.New("Template").ParseFiles(templateFile) //open and parse a template text file
	if err != nil {
		log.Printf("template parse failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "Q", searchmeta) //  Section Q sets the navigation elements
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}

	// need to add in the sidebar info....

	err = ht.ExecuteTemplate(w, "T", orsa) // Section T results
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}

}

// try https://github.com/go-resty/resty

// get the initial JSON set of URI based on the organic search
func getByQuery(query string, startAt uint64) string {
	urlstring := fmt.Sprintf("http://geodex.org/api/v1/textindex/searchset?q=%s&n=20&s=%d", query, startAt)
	resp, err := resty.R().Get(urlstring)
	if err != nil {
		log.Println(err)
	}

	return resp.String()
}

func geoJSONBySet(ja string) string {
	resp, err := resty.R().
		SetFormData(map[string]string{
			"body": ja,
		}).
		Post("http://geodex.org/api/v1/spatial/search/resourceset")
		// Post("http://geodex.org/api/v1/spatial/search/resourceset")
	if err != nil {
		log.Print(err)
	}

	fmt.Printf("\nInput: %s", ja)
	fmt.Printf("\nError: %v", err)
	fmt.Printf("\nResponse Status Code: %v", resp.StatusCode())
	fmt.Printf("\nResponse Status: %v", resp.Status())
	fmt.Printf("\nResponse Time: %v", resp.Time())
	fmt.Printf("\nResponse Received At: %v", resp.ReceivedAt())
	fmt.Printf("\nResponse Body: %v", resp) // or resp.String() or string(resp.Body())

	return resp.String()
}

func paramsBySet(ja string) string {
	// log.Println(ja)
	resp, err := resty.R().
		SetFormData(map[string]string{
			"body": ja,
		}).
		Post("http://geodex.org/api/v1/graph/ressetdetails")
	if err != nil {
		log.Print(err)
	}

	return resp.String()
}

func peopleBySet(ja string) string {
	resp, err := resty.R().
		SetFormData(map[string]string{
			"body": ja,
		}).
		Post("http://geodex.org/api/v1/graph/ressetpeople")
	if err != nil {
		log.Print(err)
	}

	// log.Println(ja)

	// log.Println(resp.String())
	return resp.String()
}

func resAsJSON(a []OrganicResults) string {

	var r []string

	for item := range a {
		// TODO..  this is troubling..   managing URI vs URL is a danger zone..   need to resolve
		// and set a policy
		// r = append(r, a[item].ID)
		r = append(r, fmt.Sprintf("<%s>", strings.TrimSpace(a[item].ID)))
	}

	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.Encode(r)

	// resJSON, err := json.Marshal(r)
	// if err != nil {
	// 	log.Fatal("Cannot encode to JSON ", err)
	// }

	// return string(resJSON)
	return fmt.Sprint(&buf)
}

func reverseURL(a string) string {
	u, err := url.Parse(a)
	if err != nil {
		panic(err)
	}

	pa := strings.Split(u.Path, "/")

	var buffer bytes.Buffer
	for j := len(pa) - 1; j > 0; j-- {
		buffer.WriteString(pa[j])
		buffer.WriteString("/")
	}

	return fmt.Sprintln(short(buffer.String(), 27))
}

func short(s string, i int) string {
	runes := []rune(s)
	if len(runes) > i {
		return string(runes[:i])
	}
	return s
}
