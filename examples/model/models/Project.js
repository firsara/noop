define(['noop/data/Model'], function(Model){
  return Model.create({
    model: 'project',
    belongsTo: 'user'
  });
});