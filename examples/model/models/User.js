define(['noop/data/Model'], function(Model){
  return Model.create({
    model: 'user',
    hasMany: 'projects'
  });
});