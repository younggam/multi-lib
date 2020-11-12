# multi-lib
Mindustry library mode that contains multicrafter scripts
Support over Mindustry 6.0 version.

What you can do with this library
1. Set multiple recipes in your crafter
2. Every input, output, craftTime can be differed
3. Selection table for which recipe to be enabled
4. Crafter can act as power generator according to recipe settings
5. Extensible block and entity function

How to use
----------
you must add ```dependencies:["multi-lib"]``` in mod.json in your mode

example code
```
const multiLib=require("multi-lib/library");
//you can use GenericSmelter instead GenericCrafter
//also GenericSmelter.SmelterBuild instead GenericCrafter.GenericCrafterBuild
//                                                                           ▼this has to be same with .json file name
//
const multi=multiLib.MultiCrafter(GenericCrafter,GenericCrafter.GenericCrafterBuild,"multi",[
    /*default form for each recipes. You can change values.
    {
        input:{
            items:[],     Modded Item:  "mod-name-item-name/amount", Vanilla Item: "item-name/amount"
            liquids:[],   Modded Liquid:  "mod-name-liquid-name/amount",  Vanilla liquid: "liquid-name/amount"
            power:0,
        },
        output:{
            items:[],
            liquids:[],
            power:0,
        },
        craftTime:80,
    },*/
    {//1  you can skip recipe properties
        output:{
            power:5.25
        },
        craftTime:12
    },
    {//2
        input:{
            items:["coal/1","sand/1"],
            liquids:["water/5"],
            power:1
        },
        output:{
            items:["thorium/1","surge-alloy/2"],
            liquids:["slag/5"],
        },
        craftTime:60
    },
    {//3
        input:{
            items:["pyratite/1","blast-compound/1"],
            liquids:["water/5"],
            power:1
        },
        output:{
            items:["scrap/1","plastanium/2","spore-pod/2"],
            liquids:["oil/5"],
        },
        craftTime:72
    },
    {//4
        input:{
            items:["sand/1"],
        },
        output:{
            items:["silicon/1"],
        },
        craftTime:30
    },
],{
    /*you can customize block here. ex) load()*/
},
/*this is Object constructor. This way is much better than literal way{a:123}
you can replace this with {} if you don't want to modify entity*/
function Extra(){
    /*you can use customUpdate=function(){}. this function excuted before update()
    also this.draw=function(){}
    you can customize entity here.
    ex)
    this._myProp=0;
    this.getMyProp=function(){
        return this._myProp;
    };
    this.setMyProp=function(a){
        this._myProp=a;
    };*/
});
/*
YOU MUST NOT MODIFY VALUE OF THESE
configurable
outputsPower
hasItems
hasLiquids
hasPower
*/
//using example without .json file. I don't recommand this way because you can't use mod item as requirements.
multi.localizedName="multi";
multi.description="multi";
multi.itemCapacity= 30;
multi.liquidCapacity= 20;
multi.size= 4;
multi.health= 100;
multi.craftEffect= Fx.pulverizeMedium;
multi.updateEffect=Fx.none;
/*true: dump items and liquids of output according to button
false: dump items and liquids of output unconditionally*/
multi.dumpToggle=false;
multi.requirements(Category.crafting,ItemStack.with(Items.copper,75));
```

ScreenShots
-----------
![제목 없음64](https://user-images.githubusercontent.com/61054554/78982290-c5905680-7b5c-11ea-9384-0b784f958ba8.png)
![제목 없음44](https://user-images.githubusercontent.com/61054554/78659489-9a142e80-7906-11ea-9e55-ab363c3fd970.png)
![제목 없음43](https://user-images.githubusercontent.com/61054554/78659495-9bddf200-7906-11ea-88a2-e68afd092dc9.png)
![제목 없음42](https://user-images.githubusercontent.com/61054554/78659501-9d0f1f00-7906-11ea-9ecc-abab9aaec827.png)
![제목 없음41](https://user-images.githubusercontent.com/61054554/78659511-9ed8e280-7906-11ea-901e-ab6195aa2355.png)
![제목 없음40](https://user-images.githubusercontent.com/61054554/78659515-a13b3c80-7906-11ea-844c-7ef07ac00f82.png)
![제목 없음39](https://user-images.githubusercontent.com/61054554/78659519-a3050000-7906-11ea-837f-d07777082424.png)
![제목 없음234](https://user-images.githubusercontent.com/61054554/98812885-aa752480-2466-11eb-8fa1-7c54271f3823.png)
