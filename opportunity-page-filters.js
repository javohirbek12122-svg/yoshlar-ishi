(() => {
 "use strict";
 const params=new URLSearchParams(window.location.search);
 const category=params.get("category"),query=params.get("query");
 const allowed=new Set(["social_support","language","business","career","education","community"]);
 const categoryInput=document.getElementById("categoryFilter"),queryInput=document.getElementById("queryFilter"),filterButton=document.getElementById("filterButton");
 if(categoryInput&&category&&allowed.has(category)){categoryInput.value=category;categoryInput.dispatchEvent(new Event("change",{bubbles:true}));}
 if(queryInput&&query){queryInput.value=query.slice(0,100);queryInput.dispatchEvent(new Event("input",{bubbles:true}));}
 if((category||query)&&filterButton)filterButton.click();
})();