document.addEventListener("DOMContentLoaded",()=>{
    const links=document.querySelectorAll("div a");

    links.forEach(link=>{
        link.addEventListener("click",event=>{
            event.preventDefault();
            const sectionId=link.getAttribute("data-section");
            document.getElementById(sectionId).scrollIntoView({
                behavior:"smooth"
            })
        })
    })

})