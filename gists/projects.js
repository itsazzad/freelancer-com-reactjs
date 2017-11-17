var counter = {
    ended: 0,
    notEnded: 0,
};
jQuery('#project_table tbody tr').each(function () {
    var started = jQuery(this).find('td.started-col small');
    if (started.text().trim().toLowerCase() === 'ended') {
        counter.ended++;
        jQuery(this).remove();
    } else {
        counter.notEnded++;
    }
});
console.error(counter);
if (counter.notEnded === 0) {
    jQuery('#browse-projects-pagination ul li:nth-last-child(2) a')[0].click();
} else {
    jQuery('#project_table tbody tr').each(function () {
        var tr = jQuery(this);

        var projectId = jQuery(this).attr('project_id');
        jQuery.ajax({
            url: "https://www.freelancer.com/api/projects/0.1/projects/" + projectId,
            cache: true
        })
            .done(function (project) {
                jQuery.ajax({
                    url: "https://www.freelancer.com/api/users/0.1/users/" + project.result.owner_id,
                    cache: true
                })
                    .done(function (user) {
                        console.error(projectId, project.result.owner_id, user.result.location.country.name);
                        tr.find('td.ProjectTable-summaryColumn').prepend('<div class="country">' + user.result.location.country.name + '</div>');

                    });

            });

    });

}
