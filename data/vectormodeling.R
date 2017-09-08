setwd("C:/Users/Cameron/OneDrive/Thesis/WebGL/Sandpile_website/data")
data = scan("data.txt", list("character"))
  
vecs = list("numeric")
for(i in 1:29){
    vecs[[i]] = as.numeric(unlist(strsplit(data[[1]][i], ",")))
}

plot("node", xlim = c(0,900), ylim = c(-200,0))
c = rainbow(29)

for(i in 1:29){
  lines(vecs[[i]], col = c[i])
}

for(i in 0:30){
  points(vecs[[29]][i*30:(i+1)*30], col = c[i])
}

lines(vecs[[29]], col = c[1])

plot(lm(vecs[[29]][(90:120)] ~ poly(c(30:60), 5)))


edges = vecs[[29]][seq(0,900,15)]
plot(edges)
tips = edges[seq(1,60,2)]
tops = edges[seq(0,60,2)]
lines(tips)
lines(tops)

model = lm(tops ~ poly(c(1:30), 2))

plot(vecs[[29]], col = c[1])
plot(model, col = c[2])

