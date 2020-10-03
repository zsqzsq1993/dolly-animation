# dolly animation doc
dolly animation is a light weight frame animation library support chain calls.
## Basic
Can download by npm: `npm i -D dolly-animation`.
It support umd, cjs and es. Normally, you have to create an instance by `const animation = DollyAnimation(interval: number)`. The interval indicates the time calling callback function.
## APIs
* loadImages(imageList, timeout): preload images
* changePosition(el, positons, imageUrl): suitable for changing positon in One Sprite Image
* chagneSrc(el, urls): suitable for changing urls to make animation
* customerFrame(fn): suitable for customer callback
* repeat(steps, times): repeat tasks, steps indicate how many task going back; times indicate repeating times
* repeatForever(): repeat previous task forever
* wait(time): waiting time after one task
* start(): start task queue
* pause(): pause animation
* restart(): restart animation
## More Information
```shell script
git clone https://github.com/zsqzsq1993/dolly-animation.git

npm run test
``` 
check my demo and watch source code.
