
const _body={
  //custom function  supports checkCond
  checkinput(tile,i){
    const entity=tile.ent();
    var vs=[];
    var bs=false;
    for(var j=0;j<entity.getRecipes().input[i].length-1;j++){
      if(entity.getRecipes().input[i][j]!=null){
        if(j!=entity.getRecipes().input[i].length-2){
          vs[j]=entity.items.get(Vars.content.getByName(ContentType.item,entity.getRecipes().input[i][j][0]))<entity.getRecipes().input[i][j][1];
        }else{
          vs[j]=entity.liquids.get(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[i][j][0]))<entity.getRecipes().input[i][j][1];
        }
        bs|=vs[j];
      }
    }
    return bs;
  },
  //custom function supprots checkCond
  checkoutput(tile,i){
    const entity=tile.ent();
    var vs_=[];
    var bs_=false;
    for(var j=0;j<entity.getRecipes().output[i].length-1;j++){
      if(entity.getRecipes().output[i][j]!=null){
        if(j!=entity.getRecipes().output[i].length-2){
          vs_[j]=entity.items.get(Vars.content.getByName(ContentType.item,entity.getRecipes().output[i][j][0]))>this.itemCapacity-entity.getRecipes().output[i][j][1];
        }else{
          vs_[j]=entity.liquids.get(Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[i][j][0]))>this.liquidCapacity-entity.getRecipes().output[i][j][1];
        }
        bs_|=vs_[j];
      }
    }
    return bs_;
  },
  //custom function decide whether to produce or not.
  checkCond(tile,i){
    const entity=tile.ent();
    if(entity.getToggle()==i){
      if(this.checkoutput(tile,i)){
        return false;
      }else if(entity.getRecipes().output[i][entity.getRecipes().output[i].length-2]!=null&&entity.liquids.get(Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[i][entity.getRecipes().output[i].length-2][0]))>=this.liquidCapacity-0.001){
        return false;
      }else if(this.checkinput(tile,i)){
        return false;
      }else if(this.hasPower==true&&entity.power.status<=0&&entity.getRecipes().input[i][entity.getRecipes().input[i].length-1]!=null){
        return false;
      }else{
        return true;
      }
    }
  },
  //custom function supports update()
  customCons(tile,i){
    const entity=tile.ent();
    entity.saveCond(this.checkCond(tile,i));
    if(this.checkCond(tile,i)){
      if(entity.getProgress(i)!=0&&entity.getProgress(i)!=null){
        entity.progress=entity.getProgress(i);
        entity.saveProgress(i,0);
      }

      entity.progress+=this.getProgressIncrease(entity,entity.getRecipes().craftTimes[i]);
      entity.totalProgress+=entity.delta();
      entity.warmup=Mathf.lerpDelta(entity.warmup,1,0.02);

      if(Mathf.chance(Time.delta()*this.updateEffectChance)){
        Effects.effect(this.updateEffect,entity.x+Mathf.range(this.size*4),entity.y+Mathf.range(this.size*4));
      }

    }else{

      entity.warmup=Mathf.lerp(entity.warmup,0,0.02);
    }


  },
  //decide which item to receive
  acceptItem(item,tile,source){
    const entity=tile.ent();
    var _bs=false;
    for(var i=0;i<entity.getRecipes().input.length;i++){
      for(var j=0;j<entity.getRecipes().input[i].length-2;j++){
        if(entity.getRecipes().input[i][j]!=null){
          _bs|=item==Vars.content.getByName(ContentType.item,entity.getRecipes().input[i][j][0])?true:false;
        }
      }
    }
    return _bs&&entity.items.get(item)<this.getMaximumAccepted(tile,item);
  },
  //decide which liquids to receive
  acceptLiquid(tile,source,liquid,amount){
    const entity=tile.ent();
    var _Bs=false;
    for(var i=0;i<entity.getRecipes().input.length;i++){
      if(entity.getToggle()==i&&entity.getRecipes().input[i][entity.getRecipes().input[i].length-2]!=null){
        _Bs|=liquid==Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[i][entity.getRecipes().input[i].length-2][0])?true:false;
      }
    }

    return _Bs&&entity.liquids.currentAmount()+amount<this.liquidCapacity&&(entity.liquids.current()==liquid||entity.liquids.currentAmount()<0.01);
  },
  //display bar? shows whether enough material is available
  displayConsumption(tile,table){
    const entity=tile.ent();
    table.left();
    for(var i=0;i<entity.getRecipes().input.length;i++){
      for(var j=0;j<entity.getRecipes().input[i].length-1;j++){
        var image=new MultiReqImage();
        if(entity.getRecipes().input[i][j]!=null&&j!=entity.getRecipes().input[i].length-2){
          Vars.content.items().each(boolf(k=>k==Vars.content.getByName(ContentType.item,entity.getRecipes().input[i][j][0])),cons((item)=>{
            var m1=entity.getRecipes().input[i][j][1];
            image.add(new ReqImage(new ItemImage(item.icon(Cicon.medium),entity.getRecipes().input[i][j][1]),boolp(()=>entity!=null&&entity.items.has(item,m1)&&entity.items!=null)));
          }));

          table.add(image).size(8*4);
        }else if(entity.getRecipes().input[i][j]!=null){
          Vars.content.liquids().each(boolf(k=>k==Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[i][j][0])),cons((liquid)=>{
            var m2=entity.getRecipes().input[i][j][1];
            var m3=Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[i][j][0]);
            image.add(new ReqImage(new ItemImage(liquid.icon(Cicon.medium),entity.getRecipes().input[i][j][1]),boolp(()=>entity!=null&&entity.liquids.get(m3)>m2&&entity.items!=null)));
          }));
          table.add(image).size(8*4);
        }
      }
      if(i%2==0){
        table.addImage(Icon.pause).size(8*4);
      }
      if(i%2==1){
        table.row();
      }
    }
  },
  //show current amount of items and poweroutput
  setBars(){
    this.super$setBars();
    this.bars.remove("items");
    this.bars.add("items",func(entity=>
      new Bar(prov(()=>Core.bundle.format("bar.items",entity.tile.entity.getItemStat().join('/')
    )),prov(()=>Pal.items),floatp(()=>entity.items.total()/(this.itemCapacity*this.findOverlapped(entity.tile,true,false))))
    ));
    this.bars.add("poweroutput",func(entity=>
      new Bar(prov(()=>Core.bundle.format("bar.poweroutput",entity.block.getPowerProduction(entity.tile)*60)),prov(()=>Pal.powerBar),floatp(()=>entity.tile.entity!=null?entity.tile.entity.getPowerStat():0))
    ));
  },
  //progress
  getProgressIncrease(entity,baseTime){
    for(var i=0;i<entity.tile.entity.getRecipes().input.length;i++){
      if(baseTime==entity.tile.entity.getRecipes().craftTimes[i]&&entity.tile.entity.getRecipes().input[i][entity.tile.entity.getRecipes().input[i].length-1]!=null){
        return this.super$getProgressIncrease(entity,baseTime);
      }else if(baseTime==entity.tile.entity.getRecipes().craftTimes[i]){
        return 1/baseTime*entity.delta();
      }
    }
  },
  //Real power production
  getPowerProduction(tile){
    const entity=tile.ent();
    for(var i=0;i<entity.getRecipes().output.length;i++){
      if(entity.getToggle()==i&&entity.getRecipes().output[i][entity.getRecipes().output[i].length-1]!=null&&entity.getCond()){
        if(entity.getRecipes().input[i][entity.getRecipes().input[i].length-1]!=null){
          return entity.getRecipes().output[i][entity.getRecipes().output[i].length-1]*entity.efficiency();
        }else{
          return entity.getRecipes().output[i][entity.getRecipes().output[i].length-1];
        }
      }
    }
    return 0;
  },
  //check overLapped input and contain some util
  findOverlapped(tile,a,b){
    if(tile==null){
      return;
    }
    const entity=tile.ent();
    var n=0;
    var overlapped=[];
    var overLapped=[];
    var index=0;
    var index_=0;
    for(var j=0;j<entity.getRecipes().output.length;j++){
      for(var jj=0;jj<entity.getRecipes().output[j].length-2;jj++){
        if(entity.getRecipes().output[j][jj]!=null){
          overlapped[index]=Vars.content.getByName(ContentType.item,entity.getRecipes().output[j][jj][0]);
          n+=1;
          index++;
        }
      }
    }
    for(var i=0;i<entity.getRecipes().input.length;i++){
      for(var ii=0;ii<entity.getRecipes().input[i].length-2;ii++){
        if(entity.getRecipes().input[i][ii]!=null){
          overlapped[index]=Vars.content.getByName(ContentType.item,entity.getRecipes().input[i][ii][0]);
          n+=1;
          index++;
        }
      }
    }
    for(var k=0;k<overlapped.length;k++){
      if(overlapped.indexOf(overlapped[k])!=k){
        n-=1;
      }else if(tile!=null){
        overLapped[index_]=entity.items.get(overlapped[k]);
        index_++;
      }
    }
    if(a==true){
      return n;
    }else if(b==true){
      return overLapped;
    }
  },
  /*semi-automatic
  limited 10 recipes. but you can extend using copy-paste each else if part and change number ex)input.[9]->input.[10]
  I know. It seems to be optimizable using loop.
  but outputs output[0] only. Idk why.
  */
  update(tile){
    const entity=tile.ent();
    entity.modifyItemStat(this.findOverlapped(tile,false,true));
    for(var j=0;j<entity.getRecipes().input.length;j++){
      if(entity.getRecipes().output[j][entity.getRecipes().output[j].length-1]!=null&&entity.getToggle()==j&&entity.getCond()){
        if(entity.getRecipes().input[j][entity.getRecipes().input[j].length-1]!=null){
          entity.modifyPowerStat(entity.efficiency());
        }else{
          entity.modifyPowerStat(1);
        }
      }else if(entity.getRecipes().output[j][entity.getRecipes().output[j].length-1]==null&&entity.getToggle()==j||entity.getToggle()==-1){
        entity.modifyPowerStat(0);
      }
    }
    if(!entity.getCond()){
      entity.modifyPowerStat(0);
    }
    if(entity.getToggle()==0&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,0);
      if(entity.progress>=1){
        for(var k=0;k<entity.getRecipes().input[0].length-2;k++){
          if(entity.getRecipes().input[0][k]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[0][k][0]),entity.getRecipes().input[0][k][1]));
          }
        }
        if(entity.getRecipes().input[0][entity.getRecipes().input[0].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[0][entity.getRecipes().input[0].length-2][0]),entity.getRecipes().input[0][entity.getRecipes().input[0].length-2][1]);
        }
        for(var a=0;a<entity.getRecipes().output[0].length-2;a++){
          if(entity.getRecipes().output[0][a]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[0][a][0]));
            for(var aa=0;aa<entity.getRecipes().output[0][a][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[0][a][0]));
            }
          }
        }
        if(entity.getRecipes().output[0][entity.getRecipes().output[0].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[0][entity.getRecipes().output[0].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.lqiuid,entity.getRecipes().output[0][entity.getRecipes().output[0].length-2][0]),entity.getRecipes().output[0][entity.getRecipes().output[0].length-2][1]);
        }

        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }

    }else if(entity.getToggle()==1&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,1);
      if(entity.progress>=1){
        for(var f=0;f<entity.getRecipes().input[1].length-2;f++){
          if(entity.getRecipes().input[1][f]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[1][f][0]),entity.getRecipes().input[1][f][1]));
          }
        }
        if(entity.getRecipes().input[1][entity.getRecipes().input[1].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[1][entity.getRecipes().input[1].length-2][0]),entity.getRecipes().input[1][entity.getRecipes().input[1].length-2][1]);
        }
        for(var bb=0;bb<entity.getRecipes().output[1].length-2;bb++){
          if(entity.getRecipes().output[1][bb]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[1][bb][0]));
            for(var aa=0;aa<entity.getRecipes().output[1][bb][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[1][bb][0]));
            }
          }
        }

        if(entity.getRecipes().output[1][entity.getRecipes().output[1].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[1][entity.getRecipes().output[1].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[1][entity.getRecipes().output[1].length-2][0]),entity.getRecipes().output[1][entity.getRecipes().output[1].length-2][1]);
        }

        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==2&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,2);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[2].length-2;c++){
          if(entity.getRecipes().input[2][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[2][c][0]),entity.getRecipes().input[2][c][1]));
          }
        }
        if(entity.getRecipes().input[2][entity.getRecipes().input[2].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[2][entity.getRecipes().input[2].length-2][0]),entity.getRecipes().input[2][entity.getRecipes().input[2].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[2].length-2;d++){
          if(entity.getRecipes().output[2][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[2][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[2][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[2][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[2][entity.getRecipes().output[2].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[2][entity.getRecipes().output[2].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[2][entity.getRecipes().output[2].length-2][0]),entity.getRecipes().output[2][entity.getRecipes().output[2].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==3&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,3);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[3].length-2;c++){
          if(entity.getRecipes().input[3][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[3][c][0]),entity.getRecipes().input[3][c][1]));
          }
        }
        if(entity.getRecipes().input[3][entity.getRecipes().input[3].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[3][entity.getRecipes().input[3].length-2][0]),entity.getRecipes().input[3][entity.getRecipes().input[3].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[3].length-2;d++){
          if(entity.getRecipes().output[3][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[3][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[3][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[3][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[3][entity.getRecipes().output[3].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[3][entity.getRecipes().output[3].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[3][entity.getRecipes().output[3].length-2][0]),entity.getRecipes().output[3][entity.getRecipes().output[3].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==4&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,4);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[4].length-2;c++){
          if(entity.getRecipes().input[4][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[4][c][0]),entity.getRecipes().input[4][c][1]));
          }
        }
        if(entity.getRecipes().input[4][entity.getRecipes().input[4].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[4][entity.getRecipes().input[4].length-2][0]),entity.getRecipes().input[4][entity.getRecipes().input[4].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[4].length-2;d++){
          if(entity.getRecipes().output[4][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[4][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[4][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[4][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[4][entity.getRecipes().output[4].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[4][entity.getRecipes().output[4].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[4][entity.getRecipes().output[4].length-2][0]),entity.getRecipes().output[4][entity.getRecipes().output[4].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==5&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,5);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[5].length-2;c++){
          if(entity.getRecipes().input[5][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[5][c][0]),entity.getRecipes().input[5][c][1]));
          }
        }
        if(entity.getRecipes().input[5][entity.getRecipes().input[5].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[5][entity.getRecipes().input[5].length-2][0]),entity.getRecipes().input[5][entity.getRecipes().input[5].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[5].length-2;d++){
          if(entity.getRecipes().output[5][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[5][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[5][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[5][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[5][entity.getRecipes().output[5].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[5][entity.getRecipes().output[5].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[5][entity.getRecipes().output[5].length-2][0]),entity.getRecipes().output[5][entity.getRecipes().output[5].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==6&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,6);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[6].length-2;c++){
          if(entity.getRecipes().input[6][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[6][c][0]),entity.getRecipes().input[6][c][1]));
          }
        }
        if(entity.getRecipes().input[6][entity.getRecipes().input[6].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[6][entity.getRecipes().input[6].length-2][0]),entity.getRecipes().input[6][entity.getRecipes().input[6].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[6].length-2;d++){
          if(entity.getRecipes().output[6][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[6][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[6][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[6][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[6][entity.getRecipes().output[6].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[6][entity.getRecipes().output[6].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[6][entity.getRecipes().output[6].length-2][0]),entity.getRecipes().output[6][entity.getRecipes().output[6].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==7&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,7);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[7].length-2;c++){
          if(entity.getRecipes().input[7][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[7][c][0]),entity.getRecipes().input[7][c][1]));
          }
        }
        if(entity.getRecipes().input[7][entity.getRecipes().input[7].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[7][entity.getRecipes().input[7].length-2][0]),entity.getRecipes().input[7][entity.getRecipes().input[7].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[7].length-2;d++){
          if(entity.getRecipes().output[7][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[7][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[7][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[7][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[7][entity.getRecipes().output[7].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[7][entity.getRecipes().output[7].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[7][entity.getRecipes().output[7].length-2][0]),entity.getRecipes().output[7][entity.getRecipes().output[7].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==8&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,8);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[8].length-2;c++){
          if(entity.getRecipes().input[8][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[8][c][0]),entity.getRecipes().input[8][c][1]));
          }
        }
        if(entity.getRecipes().input[8][entity.getRecipes().input[8].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[8][entity.getRecipes().input[8].length-2][0]),entity.getRecipes().input[8][entity.getRecipes().input[8].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[8].length-2;d++){
          if(entity.getRecipes().output[8][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[8][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[8][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[8][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[8][entity.getRecipes().output[8].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[8][entity.getRecipes().output[8].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[8][entity.getRecipes().output[8].length-2][0]),entity.getRecipes().output[8][entity.getRecipes().output[8].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }else if(entity.getToggle()==9&&entity.getToggle()<entity.getRecipes().input.length){
      this.customCons(tile,9);
      if(entity.progress>=1){
        for(var c=0;c<entity.getRecipes().input[9].length-2;c++){
          if(entity.getRecipes().input[9][c]!=null){
            entity.items.remove(ItemStack(Vars.content.getByName(ContentType.item,entity.getRecipes().input[9][c][0]),entity.getRecipes().input[9][c][1]));
          }
        }
        if(entity.getRecipes().input[9][entity.getRecipes().input[9].length-2]!=null){
          entity.liquids.remove(Vars.content.getByName(ContentType.liquid,entity.getRecipes().input[9][c][0]),entity.getRecipes().input[9][entity.getRecipes().input[9].length-2][1]);
        }
        for(var d=0;d<entity.getRecipes().output[9].length-2;d++){
          if(entity.getRecipes().output[9][d]!=null){
            this.useContent(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[9][d][0]));
            for(var aa=0;aa<entity.getRecipes().output[9][d][1];aa++){
              this.offloadNear(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[9][d][0]));
            }
          }
        }

        if(entity.getRecipes().output[9][entity.getRecipes().output[9].length-2]!=null){
          this.useContent(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[9][entity.getRecipes().output[9].length-2][0]));
          this.handleLiquid(tile,tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[9][entity.getRecipes().output[9].length-2][0]),entity.getRecipes().output[9][entity.getRecipes().output[9].length-2][1]);
        }
        Effects.effect(this.craftEffect,tile.drawx(),tile.drawy());
        entity.progress=0;
      }
    }



    //아이템 내뱉기
    var _exit=false;
    if(entity.getToggle()!=entity.getRecipes().input.length){
      if(entity.timer.get(this.timerDump,this.dumpTime)){
        for(var ii=0;ii<entity.getRecipes().output.length;ii++){
          for(var ij=0;ij<entity.getRecipes().output[ii].length-2;ij++){
            if(entity.getRecipes().output[ii][ij]!=null&&entity.items.get(Vars.content.getByName(ContentType.item,entity.getRecipes().output[ii][ij][0]))>0){
              this.tryDump(tile,Vars.content.getByName(ContentType.item,entity.getRecipes().output[ii][ij][0]));
              _exit=true;
              break;
            }
          }if(_exit){
            _exit=false;
            break;
          }
        }
      }
      for(var jj=0;jj<entity.getRecipes().output.length;jj++){
        if(entity.getRecipes().output[jj][entity.getRecipes().output[jj].length-2]!=null&&entity.liquids.get(Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[jj][entity.getRecipes().output[jj].length-2][0]))>0.01){
          this.tryDumpLiquid(tile,Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[jj][entity.getRecipes().output[jj].length-2][0]));
          break;
        }
      }
    }else if(entity.getToggle()==entity.getRecipes().input.length){
      if(entity.timer.get(this.timerDump,this.dumpTime)&&entity.items.total()>0){
        this.tryDump(tile);
      }
      if(entity.liquids.currentAmount()>0){
        this.tryDumpLiquid(tile,entity.liquids.current());
      }
    }
  },
  //pop-up when configured
  buildConfiguration(tile,table){
    const entity=tile.ent();
    var group=new ButtonGroup();
    group.setMinCheckCount(0);
    for(var i=0;i<entity.getRecipes().input.length+1;i++){
      (function (i,tile){
        var button=table.addImageButton(Tex.whiteui,Styles.clearToggleTransi,40,run(()=>Vars.control.input.frag.config.hideConfig())).group(group).get();
        button.changed(run(()=>tile.configure(button.isChecked()?i:-1)));
        button.getStyle().imageUp=new TextureRegionDrawable(i!=entity.getRecipes().output.length?entity.getRecipes().output[i][0]!=null?Vars.content.getByName(ContentType.item,entity.getRecipes().output[i][0][0]).icon(Cicon.small):entity.getRecipes().output[i][entity.getRecipes().output[i].length-2]!=null?Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[i][entity.getRecipes().output[i].length-2][0]).icon(Cicon.small):entity.getRecipes().output[i][entity.getRecipes().output[i].length-1]!=null?Icon.power:Icon.cancel:Icon.trash);
        button.update(run(()=>button.setChecked(entity==null?false:entity.getToggle()==i)));

      })(i,tile)
    }
    table.row();
    var _max=[];
    var max_=0;
    for(var l=0;l<entity.getRecipes().output.length;l++){
      _max[l]=entity.getRecipes().output[l].length;
    }
    for(var ll=0;ll<_max.length;ll++){
      max_=max_==0?_max[ll]:max_<_max[ll]?_max[ll]:max_;
    }
    for(var jj=1;jj<max_;jj++){
      for(var kk=0;kk<entity.getRecipes().output.length;kk++){
        if(jj!=entity.getRecipes().output[kk].length-2&&jj!=entity.getRecipes().output[kk].length-1){
          table.addImage(entity.getRecipes().output[kk][jj]==null?Tex.clear:Vars.content.getByName(ContentType.item,entity.getRecipes().output[kk][jj][0]).icon(Cicon.small));
        }else{
          table.addImage(Tex.clear);
        }
      }
      table.row();
    }
    for(var j=0;j<entity.getRecipes().output.length;j++){
      var null1=true;
      for(var a=0;a<entity.getRecipes().output[j].length-2;a++){
        if(entity.getRecipes().output[j][a]!=null){
          null1&=false;
        }
      }
      table.addImage(entity.getRecipes().output[j][entity.getRecipes().output[j].length-2]==null||null1?Tex.clear:Vars.content.getByName(ContentType.liquid,entity.getRecipes().output[j][entity.getRecipes().output[j].length-2][0]).icon(Cicon.small));
    }
    table.row();
    for(var k=0;k<entity.getRecipes().output.length;k++){
      var null2=true;
      for(var b=0;b<entity.getRecipes().output[k].length-1;b++){
        if(entity.getRecipes().output[k][b]!=null){
          null2&=false;
        }
      }
      table.addImage(entity.getRecipes().output[k][entity.getRecipes().output[k].length-1]==null||null2?Tex.clear:Icon.power).height(48);
    }

  },
  //save which button configured
  configured(tile,player,value){
    const entity=tile.ent();
    for(var i=0;i<entity.getRecipes().input.length;i++){
      if(entity.getToggle()==i){
        entity.saveProgress(entity.getToggle(),entity.progress);

        break;
      }
    }

    entity.progress=0;
    entity.modifyToggle(value);
  }
}
module.exports={
  body:_body,
}
