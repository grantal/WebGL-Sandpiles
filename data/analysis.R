plot("node","firings",xlim = c(0,900),ylim = c(-200,0),type = "n")

cl <- rainbow(29)

#for (i in 1:29){
 #lines(as.numeric(data[[i]]), xlab = "node", ylab="firings", col = cl[i])
#} 

lines(as.numeric(data[[9]]), xlab = "node", ylab="firings", col = cl[20])


