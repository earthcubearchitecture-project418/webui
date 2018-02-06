Slim.tag(
    'repeater-child',
    '<div class="div-table-row"> \
             <div class="div-table-colsmall" bind:prop="item.value" bind>{{item.value}}</div> \
            <div class="div-table-colsmall" bind:prop="item.unitText" bind>{{item.unitText}}</div>\
            <div class="div-table-col" bind:prop="item.description" bind>{{item.description}}</div>\
         </div>', class extends Slim { });
Slim.tag(
    'p418-search',
    `<h3 bind>Search results for {{repoName}}</h3>
    <div slim-if="isLoading">Loading please wait...</div>
    <div slim-if="!isLoading">
        <input type="text" slim-id="repoInput" value="[[repoName]]"/>
        <button click="handleSearchClick">Search</button>
        <div id="results">
                <repeater-child s:repeat="items as item"></repeater-child> 
        </div>
    </div>
    
    `,
    class MyTag extends Slim {

        onBeforeCreated() {
            this.repoName = 'search string';
            this.isLoading = false;
            this.stargazers = [];
        }

        handleSearchClick() {
            this.repoName = this.repoInput.value;
            this.DoSearch()
        }

        doSearch() {
            this.isLoading = true;
            fetch('http://geodex.org/api/v1/textindex/search?q=carbon&n=20&s=0&i=linkedearth')
                .then(r => r.json())
                .then(stargazers => {
                    this.stargazers = stargazers;
                    this.isLoading = false;
                })
        }

    })




    // Slim.tag(
    //     'repeater-child', 
    //     '<div class="div-table-row"> \
    //          <div class="div-table-colsmall" bind:prop="item.value" bind>{{item.value}}</div> \
    //         <div class="div-table-colsmall" bind:prop="item.unitText" bind>{{item.unitText}}</div>\
    //         <div class="div-table-col" bind:prop="item.description" bind>{{item.description}}</div>\
    //      </div>', class extends Slim { });
    // Slim.tag(
    //     'geocomponents-parameters',
    //     `<div class="div-table">
    //                <repeater-child s:repeat="items as item"></repeater-child> 
    //     </div>`,
    //     class ParamTag extends Slim {
    //         // your code here
    //         onBeforeCreated() {
    //             var element = document.getElementById('schemaorg');
    //             var jsonld = element.innerHTML;
    //             var obj = JSON.parse(jsonld);
    //             this.items = obj.variableMeasured
    //         }
    //         myMethod() {
    //             return "test"
    //         }
    //     }
    // )