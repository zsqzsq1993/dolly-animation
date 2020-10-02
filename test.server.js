const express = require('express')

const app = express()

const port = 8080

app.use(express.static('./demo'))

app.listen(port, () => {
    console.log(`listen on localhost:${port}`)
})
