package search

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"text/template"

	"earthcube.org/Project418/webui/sparql"

	"github.com/blevesearch/bleve"
	strip "github.com/grokify/html-strip-tags-go"
)

// FreeTextResults is the exported struct holding the
// results of the Bleve search
type FreeTextResults struct {
	Place           int
	Index           string
	Score           float64
	ID              string
	Fragments       []Fragment
	IconName        string
	IconDescription string
	Description     string
}

// Fragment holds the matched text fragment strings
type Fragment struct {
	Key   string
	Value []string //[]string
}

// ResultsMetaData holds some information about the search results
type ResultsMetaData struct {
	Term      string
	Count     uint64
	StartAt   uint64
	EndAt     uint64
	NextStart uint64
	PrevStart uint64
	Message   string
}

// Qstring holds the query and modifers for the query
type Qstring struct {
	Query      string
	Qualifiers map[string]string
}

// HoldingPage is a simple handler used before we were ready to expose
// the search systems.  Once operational we should remove or at least comment
// out this function.
func HoldingPage(w http.ResponseWriter, r *http.Request) {
	templateFile := "./templates/holdingtemplate.html"

	ht, err := template.New("Template").ParseFiles(templateFile) //open and parse a template text file
	if err != nil {
		log.Printf("template parse failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "Q", nil) //substitute fields in the template 't', with values from 'user' and write it out to 'w' which implements io.Writer
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}
}

// DoSearch is there to do searching..  (famous documentation style intact!)
func DoSearch(w http.ResponseWriter, r *http.Request) {
	log.Printf("r path: %s\n", r.URL.Query()) // need to log this better so I can filter out search terms later
	queryterm := r.URL.Query().Get("q")
	queryterm = strings.TrimSpace(queryterm) // remove leading and trailing white spaces a user might put in (not internal spaces though)

	// get the start at value or set to 0
	var startAt uint64
	startAt = 0
	if s, err := strconv.Atoi(r.URL.Query().Get("start")); err == nil {
		startAt = uint64(s)
	}

	// Make a var in case I want other templates I switch to later...
	templateFile := "./templates/indextemplate.html"

	// parse the queryterm to get the colon based qualifiers
	qstring := parse(queryterm)
	distance := ""
	queryResults, sr := indexCall(qstring, startAt, distance)
	qrl := len(queryResults)

	// moved the len test and string mod to here
	// TODO..  Yet Another Ugly Section (YAUS)  (I've named the pattern..  that is just sad)
	// check here..  if results are 0 then recursive call with ~1
	// check here and if 0 then try again with ~2
	// var finalResults []FreeTextResults
	fmt.Printf("Len: %d    distance: %s \n", qrl, distance)
	if qrl == 0 {
		if strings.Contains(distance, "") {
			fmt.Println("Call ~1")
			queryResults, err := indexCall(qstring, startAt, "~1")
			qrl = len(queryResults)
			if err != nil {
				log.Print(err)
			}
		}
	}
	if qrl == 0 {
		if strings.Contains(distance, "~1") {
			fmt.Println("Call ~2")
			queryResults, err := indexCall(qstring, startAt, "~2")
			qrl = len(queryResults)
			if err != nil {
				log.Print(err)
			}
		}
	}

	// if len(results) > 0 {
	// 	finalResults = results
	// }

	// Set up some metadata on the search results to return
	var searchmeta ResultsMetaData
	searchmeta.Term = queryterm // We don't use qstring.Query here since we want the full string including qualifiers, returned to the page for rendering with results
	searchmeta.Count = sr.Total
	searchmeta.StartAt = startAt
	searchmeta.EndAt = startAt + 20 // TODO make this a var..   do not set statis!!!!!!
	searchmeta.NextStart = searchmeta.EndAt + 1
	searchmeta.PrevStart = searchmeta.StartAt - 20
	if qrl == 0 {
		if queryterm == "" {
			searchmeta.Message = "P418 Search Test"

		} else {
			searchmeta.Message = "Search results empty"
		}
	}

	// If we have a term.. search the triplestore
	var spres sparql.SPres
	if qrl > 0 {
		topResult := queryResults[0] // pass this as a new template section TR!
		fmt.Println(topResult.ID)
		var err error
		spres, err = sparql.DoCall(topResult.ID) // turn sparql call on / off
		if err != nil {
			log.Printf("SPARQL call failed: %s", err)
		}
		// fmt.Print(spres.Description)
	}

	ht, err := template.New("Template").ParseFiles(templateFile) //open and parse a template text file
	if err != nil {
		log.Printf("template parse failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "Q", searchmeta) //substitute fields in the template 't', with values from 'user' and write it out to 'w' which implements io.Writer
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "T", queryResults) //substitute fields in the template 't', with values from 'user' and write it out to 'w' which implements io.Writer
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}

	err = ht.ExecuteTemplate(w, "S", spres) //substitute fields in the template 't', with values from 'user' and write it out to 'w' which implements io.Writer
	if err != nil {
		log.Printf("Template execution failed: %s", err)
	}
}

func parse(qstring string) Qstring {
	reInsideWhtsp := regexp.MustCompile(`[\s\p{Zs}]{2,}`) // get rid of multiple spaces
	qstring = reInsideWhtsp.ReplaceAllString(qstring, " ")
	sa := strings.Split(qstring, " ")

	var buffer bytes.Buffer
	qpairs := make(map[string]string)
	for _, item := range sa {
		if strings.ContainsAny(item, ":") {
			qualpair := strings.Split(item, ":")
			qpairs[qualpair[0]] = qualpair[1]
		} else {
			buffer.WriteString(item)
			buffer.WriteString(" ")
		}
	}

	qs := Qstring{Query: buffer.String(), Qualifiers: qpairs}
	return qs
}

// termReWrite puts the bleve ~1 or ~2 term options on for fuzzy matching
func termReWrite(phrase string, distanceAppend string) string {
	terms := strings.Split(phrase, " ")

	for k := range terms {
		var str bytes.Buffer
		str.WriteString(strings.TrimSpace(terms[k]))
		str.WriteString(distanceAppend)
		terms[k] = str.String()
	}

	fmt.Println(strings.Join(terms, " "))
	return strings.Join(terms, " ")
}

// TODO  TLDR;   stop being lazy and using copy and paste!!!!!!!
// TODO   This a LOT of hideous duplicate code..  need to apply some logic here and reduce the line count!!!!!!!
// return JSON string..  enables use of func for REST call too
// return JSON string..  enables use of func for REST call too
func indexCall(qstruct Qstring, startAt uint64, distance string) ([]FreeTextResults, *bleve.SearchResult) {
	if qstruct.Query == "" {
		return nil, nil
	}

	// TODO ..  improve this..
	// Really need to check if it is ~1 or ~2.  If not, set to empty
	// if distance == "" {
	// 	distance = ""
	// }

	// Playing with index aliases
	// Open all indexes in an alias and use this in a named call
	log.Printf("Start building Codex index \n")

	index1, err := bleve.OpenUsing("indexes/bcodmo.bleve", map[string]interface{}{
		"read_only": true,
	})
	if err != nil {
		log.Printf("Error with index1 alias: %v", err)
	}
	index2, err := bleve.OpenUsing("indexes/linkedearth.bleve", map[string]interface{}{
		"read_only": true,
	})
	if err != nil {
		log.Printf("Error with index2 alias: %v", err)
	}
	index3, err := bleve.OpenUsing("indexes/ocd.bleve", map[string]interface{}{
		"read_only": true,
	})
	if err != nil {
		log.Printf("Error with index3 alias: %v", err)
	}
	index4, err := bleve.OpenUsing("indexes/csdco.bleve", map[string]interface{}{
		"read_only": true,
	})
	if err != nil {
		log.Printf("Error with index4 alias: %v", err)
	}
	index5, err := bleve.OpenUsing("indexes/rwg.bleve", map[string]interface{}{
		"read_only": true,
	})
	if err != nil {
		log.Printf("Error with index5 alias: %v", err)
	}

	var index bleve.IndexAlias

	if _, ok := qstruct.Qualifiers["source"]; ok {
		//  TODO..  system needs to handle accepting N number type: qualifiers like type:jrso,csdco
		if strings.Contains(qstruct.Qualifiers["source"], "bco-dmo") {
			index = bleve.NewIndexAlias(index1)
			log.Println("Active index: 1")
		}
		if strings.Contains(qstruct.Qualifiers["source"], "linkedearth") {
			index = bleve.NewIndexAlias(index2)
			log.Println("Active index: 2")
		}
		if strings.Contains(qstruct.Qualifiers["source"], "opencore") {
			index = bleve.NewIndexAlias(index3)
			log.Println("Active index: 3")
		}
		if strings.Contains(qstruct.Qualifiers["source"], "csdco") {
			index = bleve.NewIndexAlias(index4)
			log.Println("Active index: 4")
		}
		if strings.Contains(qstruct.Qualifiers["source"], "rwg") {
			index = bleve.NewIndexAlias(index5)
			log.Println("Active index: 5")
		}
	} else {
		// index = bleve.NewIndexAlias(index1, index2, index3)
		// log.Println("Active index: 1,2,3")
		index = bleve.NewIndexAlias(index1, index2, index3, index4, index5) // just use rwg and janus for now in P418
		log.Println("Active index: 1,2,3,4,5")
	}

	log.Printf("Codex index built\n")

	// parse string and add ~2 to each term/word, then rebuild as a string.
	fmt.Printf("Ready to search with %s and distance: %s \n", qstruct.Query, distance)
	query := bleve.NewQueryStringQuery(termReWrite(qstruct.Query, distance))
	search := bleve.NewSearchRequestOptions(query, 20, int(startAt), false) // no explanation

	// TODO  Add facet aspect  ref: http://www.blevesearch.com/docs/Result-Faceting/
	// termFacet := bleve.NewFacetRequest("opencore:params.Pname", 5)
	// search.AddFacet("terms", termFacet)

	search.Highlight = bleve.NewHighlightWithStyle("html") // need Stored and IncludeTermVectors in index
	searchResults, err := index.Search(search)
	if err != nil {
		log.Printf("Error search results: %v  , %s", err, search)
	}

	hits := searchResults.Hits // array of struct DocumentMatch

	var results []FreeTextResults

	for k, item := range hits {
		fmt.Printf("\n%d: %s, %f, %s, %v\n", k, item.Index, item.Score, item.ID, item.Fragments)
		// fmt.Printf("%v\n", item.Fields["potentialAction.target.description"])
		var frags []Fragment
		for key, frag := range item.Fragments {
			// fmt.Printf("%s   %s\n", key, frag)
			frags = append(frags, Fragment{key, frag})
		}

		for k, v := range item.Fields {
			fmt.Printf("Field %v. Value %v.\n", k, v)
		}

		// set up a material icon   ref:  https://material.io/icons/
		var iconName string
		var iconDescription string
		if strings.Contains(item.Index, "ocd") {
			iconName = "file_download"          // material design icon name used in template
			iconDescription = "source:OpenCore" // material design icon name used in template
		}
		if strings.Contains(item.Index, "bcodmo") {
			iconName = "file_download"         // material design icon name used in template
			iconDescription = "source:BCO-DMO" // material design icon name used in template
		}
		if strings.Contains(item.Index, "csdco") {
			iconName = "http"                // material design icon name used in template  alts:  web_asset or web
			iconDescription = "source:CSDCO" // material design icon name used in template  alts:  web_asset or web
		}
		if strings.Contains(item.Index, "linkedearth") {
			iconName = "http"                      // material design icon name used in template  alts:  web_asset or web
			iconDescription = "source:LinkedEarth" // material design icon name used in template  alts:  web_asset or web
		}
		if strings.Contains(item.Index, "rwg") {
			iconName = "http"                                               // material design icon name used in template  alts:  web_asset or web
			iconDescription = "source:EarthCube CDF Registry Working Group" // material design icon name used in template  alts:  web_asset or web
		}

		// TODO make a SPARQL call and get the description field and see what we can get
		// make a SPARQL call on item ID..  strip http:// from the ID and add in a UNION call across HTTP and HTTPS
		// do as a full function call
		description := strip.StripTags(SPARQLDescription(item.ID))

		results = append(results, FreeTextResults{k, item.Index, item.Score, item.ID, frags, iconName, iconDescription, description})
	}

	//  Looking at the JSON a bit to see about using typescript and stencil to
	// display results from the pure JSON (call via AJAX)
	// fmt.Printf("Looping status count:%d, distance:%s\n", len(results), distance)
	// json, _ := json.MarshalIndent(searchResults, "", " ")
	// fmt.Print(string(json))

	index.Close()
	return results, searchResults
}

func SPARQLDescription(subject string) string {

	desc, err := sparql.DescriptionCall(subject) // turn sparql call on / off
	if err != nil {
		log.Printf("SPARQL call failed: %s", err)
	}

	return desc
}

// TODO
// need a stop words function for us with words like: "data"  in it  :)
