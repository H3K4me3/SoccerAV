
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







match <- li.matches[[42]]
match <- match %>% filter(type.name == "Pass")
table(is.na(match$pass.recipient.id))
table(match$pass.type.name, useNA = "ifany")
## Overall stat of pass outcomes
table(match$pass.outcome.name, useNA = "ifany")
## Stat of pass outcomes with a recipient
table(filter(match, !is.na(match$pass.recipient.name))$pass.outcome.name,
      useNA = "ifany")

match <- mutate(match, location.x = sapply(location, function(x) x[1]))
match <- mutate(match, location.y = sapply(location, function(x) x[2]))
match <- mutate(match, end_x = sapply(pass.end_location, function(x) x[1]))
match <- mutate(match, end_y = sapply(pass.end_location, function(x) x[2]))

a <- match %>% filter(is.na(pass.recipient.name)) %>%
    select(pass.length, location.x, location.y, end_x, end_y,
           pass.recipient.id, pass.type.name, pass.outcome.name)

print(a, n = 100)





match <- li.matches[[31]]
table(match$player.name)



### Examine shot and goals

match <- li.matches[[59]]
table(match$type.name)

match[match$type.name == "Shot", ] %>%
    select(shot.outcome.name, starts_with("shot")) %>%
    print(n = Inf)

