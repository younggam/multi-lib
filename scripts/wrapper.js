const lib = require("multi-lib2/library");

function cloneObject(obj) {
    var clone = {};
    for(var i in obj) {
        if(typeof obj[i] == "object" && obj[i] != null) clone[i] = cloneObject(obj[i]);
        else clone[i] = obj[i];
    }
    return clone;
}
module.exports = {
    extend(Type, name, recipes, def, Entity) {
        const block = new lib.MultiCrafter(recipes);
        Object.assign(block, def);
        const multi = extendContent(Type, name, block);
        multi.entityType = prov(() => extend(GenericCrafter.GenericCrafterEntity, Object.assign(new lib.MultiCrafterEntity(), cloneObject(Entity))));
        multi.consumes.add(extend(ConsumePower, {
            requestedPower(entity) {
                if(typeof entity["getToggle"] !== "function") return 0;
                var i = entity.getToggle();
                if(i < 0) return 0;
                var input = entity.block.getRecipes()[i].input.power;
                if(input > 0 && entity.getCond()) return input;
                return 0;
            }
        }));
        multi.configurable = true;
        multi.hasItems = true;
        multi.hasLiquids = true;
        multi.hasPower = true;
        multi.tmpRecs = recipes;
        return multi;
    }
};
