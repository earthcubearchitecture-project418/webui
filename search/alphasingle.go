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

// AlphaSingle for threaded searches UI testing
func AlphaSingle(w http.ResponseWriter, r *http.Request) {

	log.Printf("r path: %s\n", r.URL.Query()) // need to log this better so I can filter out search terms later
	queryterm := r.URL.Query().Get("q")
	queryterm = strings.TrimSpace(queryterm) // remove leading and trailing white spaces a user might put in (not internal spaces though)
	index := r.URL.Query().Get("i")

	// get the start at value or set to 0
	var startAt uint64
	startAt = 0
	if s, err := strconv.Atoi(r.URL.Query().Get("start")); err == nil {
		startAt = uint64(s)
	}

	// indexes := [6]string{"bco-dmo", "linkedearth", "opencore", "csdco", "rwg", "ieda"}
	// templateFile := "./templates/alphatemplate.html"
	templateFile := "./templates/alphasingletemplate.html"

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
	searchmeta.EndAt = startAt + 50 // TODO make this a var..   do not set statis!!!!!!
	searchmeta.NextStart = searchmeta.EndAt + 1
	searchmeta.PrevStart = searchmeta.StartAt - 50

	searchmeta.Message = ""

	// get the resources
	resp := getSingleByQuery(qstring.Query, index, startAt) // not using the qualifiers at this time
	fmt.Println(resp)
	var orsa []OrganicResults
	if err := json.Unmarshal([]byte(resp), &orsa); err != nil {
		log.Println(err)
	}

	fmt.Println(orsa)

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
func getSingleByQuery(query, index string, startAt uint64) string {
	resp, err := resty.R().
		SetQueryParams(map[string]string{
			"q": query,
			"n": "50",
			"s": strconv.FormatUint(startAt, 16),
			"i": index,
		}).
		Get("http://geodex.org/api/v1/textindex/search")
	if err != nil {
		log.Println(err)
	}

	return resp.String()
}
