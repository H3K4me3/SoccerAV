
library(StatsBombR)
library(tibble)
library(dplyr)

matches <- FreeMatches(43)

li.matches <- vector("list", length = nrow(matches))
for (i in seq(nrow(matches))) {
    capture.output(li.matches[[i]] <- get.matchFree(Match = matches[i, ]))
}
#saveRDS(li.matches, "matches.rds")
#li.matches <- readRDS("matches.rds")

li.matches <- lapply(li.matches, as_tibble)

#match <- li.matches[[which(matches$match_id == 7525)]]
match <- li.matches[[59]]
match <- match %>% select(period, team.name, location, type.name, shot.outcome.name)
match <- match %>% filter(type.name == "Shot")
match <- match %>% filter(shot.outcome.name == "Goal")
match <- mutate(match, location.x = sapply(location, function(x) x[1]))
match <- mutate(match, location.y = sapply(location, function(x) x[2]))
match
