Chart.pluginService.register({
    // need to manipulate tooltip visibility before its drawn (but after update)
    beforeDraw: function(chartInstance, easing) {
      // check and see if the plugin is active (its active if the option exists)
      if (chartInstance.config.options.tooltips.onlyShowForDatasetIndex) {
        // get the plugin configuration
        var tooltipsToDisplay = chartInstance.config.options.tooltips.onlyShowForDatasetIndex;
  
        // get the active tooltip (if there is one)
        var active = chartInstance.tooltip._active || [];
  
        // only manipulate the tooltip if its just about to be drawn
        if (active.length > 0) {
          // first check if the tooltip relates to a dataset index we don't want to show
          if (tooltipsToDisplay.indexOf(active[0]._datasetIndex) === -1) {
            // we don't want to show this tooltip so set it's opacity back to 0
            // which causes the tooltip draw method to do nothing
            chartInstance.tooltip._model.opacity = 0;
          }
        }
      }
    }
  });