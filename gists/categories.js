var re = /\(([^)]+)\)/g;
var skills = {};
$('#browseCategories .Container .PageJob-category').each(function () {
    $(this).find('.PageJob-browse-list li').each(function () {
        var skillCount = $(this).find('a').first().html();
        var result = re[Symbol.split](skillCount);
        var skill = result[0].trim().replace(/&nbsp;/gi, '');
        var count = result[result.length - 2].trim();
        if(!skills[count]){
            skills[count] = [];
        }
        skills[count].push(skill);
    });
});
console.error(skills);
