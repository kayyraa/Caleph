import * as Api from "./api.js";

const SearchInput = document.querySelector(".SearchInput");
const DropdownList = document.querySelector(".DropdownList[search]");
const ArticleWizard = document.querySelector(".ArticleWizard");
ArticleWizard.style.display = "none";

const ArticleStorage = new Api.Storage("Articles");

const NewArticleButton = document.createElement("div");
NewArticleButton.innerHTML = "There was no article about that, click here to create one!";
NewArticleButton.style.display = "none";
NewArticleButton.style.cursor = "pointer";
NewArticleButton.addEventListener("click", () => {
    ArticleWizard.style.display = "initial";
    NewArticleButton.style.display = "none";

    ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value = SearchInput.value;
});
DropdownList.appendChild(NewArticleButton);

const PublishArticleButton = document.querySelector(".PublishArticleButton");
PublishArticleButton.addEventListener("click", async () => {
    const ArticleName = ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value;
    const ArticleContent = ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value;
    if (!ArticleName || !ArticleContent) return;

    const Article = {
        Name: ArticleName,
        Content: ArticleContent,
        Author: JSON.parse(localStorage.getItem("User")).Username
    }

    await ArticleStorage.AppendDocument(Article);
    location.reload();
});

SearchInput.addEventListener("input", () => {
    const Search = SearchInput.value;
    if (!Search) return;

    const ExistingArticleElements = DropdownList.querySelectorAll("div[id]:not(#no-article)");
    ExistingArticleElements.forEach((Element) => {
        Element.remove();
    });

    const QuerySearchArticles = ArticleStorage.GetDocumentByFieldIncludes("Name", Search);
    QuerySearchArticles.then((FoundArticles) => {
        if (FoundArticles.length === 0) {
            NewArticleButton.style.display = "initial";
        } else {
            NewArticleButton.style.display = "none";

            FoundArticles.forEach((Article) => {
                const ArticleElement = document.createElement("div");
                ArticleElement.innerHTML = Article.Name;
                ArticleElement.setAttribute("id", Article.id);

                const Relevance = Article.Name.toLowerCase().includes(Search.toLowerCase()) ? 0 : 1;
                ArticleElement.style.order = Relevance;

                DropdownList.appendChild(ArticleElement);
            });
        }
    });
});
