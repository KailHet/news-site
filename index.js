import express from 'express'
import path from "node:path"
import axios from "axios"
import fs from "fs"
import xml from "xml2json"
import ejs from 'ejs'

const app = express()
const port = 80

app.set('views', './public');
app.set('view engine', 'ejs')
app.use(express.static('./public'));

app.get('/', async (req, res) => {

  let news = JSON.parse(fs.readFileSync('./data/history.json'))
  let titles = []

  for (let post of news.posts) {
    titles.push(post.title)
  }

  const sources = JSON.parse(fs.readFileSync('./data/config.json')).sources
  for (let source of sources) {

    if (source.post) {
      const obj = await axios.get(source.rss)
      const xmlData = obj.data
      const jsonData = xml.toJson(xmlData, {object: true})
      const latestItem = jsonData?.rss?.channel?.item?.[0]

      if (latestItem) {
        for (let i = 0; i < news.posts.length; i++) {
          titles.push(news.posts[i].title)
          if (!titles.includes(latestItem.title)){
            titles.push(latestItem.title)
            news.posts.push(
              {
                title: latestItem.title,
                desc: String(latestItem.description).replaceAll('&nbsp;','').replaceAll('undefined',''),
                full: latestItem[source.fullContent],
                photo: latestItem.enclosure?.[0]?.url || latestItem.enclosure?.url,
                link: latestItem.link,
                category: latestItem.category,
                date: latestItem.pubDate
              }
            )
            fs.writeFileSync('./data/history.json', JSON.stringify(news, undefined, 4))
          }
        }
      }
    }
  }

  for (let post of news.posts) {
    let date = new Date(post.date)
    post.dateNormal = `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`
  }
  let reversed = news.posts.reverse()

  res.render('index', {news: reversed})

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


