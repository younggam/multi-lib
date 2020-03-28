//get moudle from library
const lib=require("multi-lib/library");

module.exports={
  extend(Type,Entity,name,def,recipes){
    const block=Object.create(lib.body);
    Object.assign(block,{
      //these functions doesn't get tile. so separate in here
      //for display-info
      setStats(){
        this.super$setStats();
        this.stats.remove(BlockStat.powerUse);
        this.stats.remove(BlockStat.productionTime);
        for(var i=0;i<rec.craftTimes.length;i++){
          this.stats.add(BlockStat.productionTime,i+1,StatUnit.none);
          this.stats.add(BlockStat.productionTime,rec.craftTimes[i]/60,StatUnit.seconds);
        }
        for(var j=0;j<rec.output.length;j++){
          this.stats.add(BlockStat.output,j+1,StatUnit.none);
          for(var jj=0;jj<rec.output[j].length-1;jj++){
            if(rec.output[j][jj]!=null&&jj!=rec.output[j].length-2){
              this.stats.add(BlockStat.output,rec.output[j][jj]);
            }else if(rec.output[j][jj]!=null){
              this.stats.add(BlockStat.output,rec.output[j][jj].liquid,rec.output[j][jj].amount,false);
            }
          }
        }
        for(var k=0;k<rec.input.length;k++){
          this.stats.add(BlockStat.input,k+1,StatUnit.none);
          for(var l=0;l<rec.input[k].length-1;l++){
            if(rec.input[k][l]!=null&&l!=(rec.input[k].length-2)){
              this.stats.add(BlockStat.input,rec.input[k][l]);
            }
            else if(rec.input[k][l]!=null){
              this.stats.add(BlockStat.input,rec.input[k][l].liquid,rec.input[k][l].amount,false);
            }
          }
        }
        for(var ii=0;ii<rec.output.length;ii++){
          if(rec.output[ii][rec.output[ii].length-1]!=null){
            this.stats.add(BlockStat.basePowerGeneration,ii+1,StatUnit.none);
            this.stats.add(BlockStat.basePowerGeneration,rec.output[ii][rec.output[ii].length-1]*60,StatUnit.powerSecond);
          }else{
            this.stats.add(BlockStat.basePowerGeneration,ii+1,StatUnit.none);
            this.stats.add(BlockStat.basePowerGeneration,0,StatUnit.powerSecond);
          }
        }
        for(var l=0;l<rec.input.length;l++){
          if(rec.input[l][rec.input[l].length-1]!=null){
            this.stats.add(BlockStat.powerUse,l+1,StatUnit.none);
            this.stats.add(BlockStat.powerUse,rec.input[l][rec.input[l].length-1]*60,StatUnit.powerSecond);
          }else{
            this.stats.add(BlockStat.powerUse,l+1,StatUnit.none);
            this.stats.add(BlockStat.powerUse,0,StatUnit.powerSecond);
          }
        }
      },
      //show current amount of items and poweroutput
      setBars(){
        this.super$setBars();
        this.bars.remove("items");
        this.bars.add("items",func(entity=>
          new Bar(prov(()=>Core.bundle.format("bar.items",entity.tile.entity.getItemStat().join('/')
        )),prov(()=>Pal.items),floatp(()=>entity.items.total()/(this.itemCapacity*this.findOverlapped(null,true,false))))
        ));
        this.bars.add("poweroutput",func(entity=>
          new Bar(prov(()=>Core.bundle.format("bar.poweroutput",entity.block.getPowerProduction(entity.tile)*60)),prov(()=>Pal.powerBar),floatp(()=>entity.tile.entity!=null?entity.tile.entity.getPowerStat():0))
        ));}
      },def);
    const rec=Object.create({});
    //get recipies
    Object.assign(rec,recipes||{});
    const multi=extendContent(Type,name,block);
    //extend entity
    multi.entityType=prov(()=>extend(GenericCrafter.GenericCrafterEntity,{
      modifyToggle(a){
        this._toggle=a;
      },
      getToggle(){
        return this._toggle;
      },
      saveProgress(c,d){
        this._progressArr[c]=d;
      },
      getProgress(e){
        return this._progressArr[e];
      },
      saveCond(f){
        this.condit=f;
      },
      getCond(){
        return this.condit;
      },
      modifyPowerStat(g){
        this._powerStat=g;
      },
      getPowerStat(){
        return this._powerStat;
      },
      modifyItemStat(h){
        this._itemStat=h;
      },
      getItemStat(){
        return this._itemStat;
      },
      getRecipes(){
        return this._recipes;
      },
      _progressArr:[],
      _toggle:0,
      condit:false,
      _powerStat:0,
      _itemStat:[],
      _recipes:rec
    }));
    //power request change every recipe
    multi.consumes.add(extend(ConsumePower,{
      requestedPower(entity){
        if(entity.tile.entity==null){
          return 0;
        }
        for(var i=0;i<rec.input.length;i++){
          if(entity.tile.entity.getToggle()==i&&rec.input[i][rec.input[i].length-1]!=null&&entity.tile.entity.getCond()){
            return rec.input[i][rec.input[i].length-1];
          }
        }
        return 0;
      }
    }));
    //don't modify these
    multi.configurable=true;
    multi.outputsPower=true;
    multi.hasItems=true;
    multi.hasLiquids=true;
    multi.hasPower=true;
    return multi;
  }
}
