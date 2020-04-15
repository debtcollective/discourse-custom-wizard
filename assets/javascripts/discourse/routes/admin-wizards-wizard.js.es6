import DiscourseRoute from "discourse/routes/discourse";
import { userProperties, generateName } from '../lib/wizard';
import { set } from "@ember/object";
import { all } from "rsvp";
import { ajax } from 'discourse/lib/ajax';

export default DiscourseRoute.extend({  
  model() {
    return ajax("/admin/wizards/wizard");
  },
  
  afterModel(model) {
    return all([
      this._getThemes(model),
      this._getApis(model),
      this._getUserFields(model)
    ]);
  },
  
  _getThemes(model) {
    return ajax('/admin/themes')
      .then((result) => {
        set(model, 'themes', result.themes.map(t => {
          return {
            id: t.id,
            name: t.name
          }
        }));
      });
  },

  _getApis(model) {
    return ajax('/admin/wizards/api')
      .then((result) => set(model, 'apis', result));
  },
  
  _getUserFields(model) {
    return this.store.findAll('user-field').then((result) => {
      if (result && result.content) {
        set(model, 'userFields', 
          result.content.map((f) => ({
            id: `user_field_${f.id}`,
            name: f.name
          })).concat(
            userProperties.map((f) => ({
              id: f,
              name: generateName(f)
            }))
          )
        );
      }
    });
  },
  
  currentWizard() {
    const params = this.paramsFor('adminWizardsWizardShow');    
    
    if (params && params.wizardId) {
      return params.wizardId;
    } else {
      return null;
    }
  },
  
  setupController(controller, model) {
    let props = {
      wizardList: model.wizard_list,
      wizardId: this.currentWizard()
    }
            
    controller.setProperties(props);
  },
  
  actions: {
    changeWizard(wizardId) {
      this.controllerFor('adminWizardsWizard').set('wizardId', wizardId);
      
      if (wizardId) {
        this.transitionTo('adminWizardsWizardShow', wizardId);
      } else {
        this.transitionTo('adminWizardsWizard');
      }
    },
    
    afterDestroy() {
      this.transitionTo('adminWizardsWizard').then(() => this.refresh());
    },
    
    afterSave(wizardId) {
      this.refresh().then(() => this.send('changeWizard', wizardId));
    },
    
    createWizard() {
      this.controllerFor('adminWizardsWizard').set('wizardId', 'create');
      this.transitionTo('adminWizardsWizardShow', 'create');
    }
  }
});