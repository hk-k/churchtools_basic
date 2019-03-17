
var dayNamesMin=["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
var monthNamesShort=['Jan.', 'Feb.', 'Mar.', 'Apr.', 'Mai.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
var monthNames=['january', 'february', 'march', 'april', 'mai', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// get Month name in current language
function getMonthNames() {
  var res=new Array();
  each(monthNames, function(k,a){
    res.push(_(a));
  });
  return res;
}

// get month name 0=januar
function getMonthName(month) {
  return _(monthNames[month]);
}

/**
 * Validate event with typical event fields (startdate, enddate, ...)
 * @param event
 * @returns Error Text or false if everything is fine.
 */
function form_validateEventDate(event) {
  if (event.startdate.getTime()==0 || event.enddate.getTime()==0) {
    return "Bitte ein gültiges Datum angeben!";
  }
  if (event.enddate.getFullYear() - event.startdate.getFullYear() > 3) {
    return "Ein Event darf nicht länger als 3 Jahre gehen.";
  }
  if (event.startdate.getTime() > event.enddate.getTime()) {
    return "Das Enddatum muß vor dem Startdatum liegen";
  }
  if (event.bezeichnung == "") {
    return "Bitte eine Bezeichnung für das Event angeben!";
  }
  // Check if there is overlapping
  var ok = true;
  each(churchcore_getAllDatesWithRepeats(event), function(a, ds) {
    if (ds.startdate.getTime() != event.startdate.getTime()
         && ds.startdate.getTime() <= event.enddate.getTime())
      ok = false;
  });
  if (!ok) {
    return "Die Wiederholung darf sich nicht mit dem ersten Termin überschneiden! Bitte überprüfen.";
  }
  return false;
}

function getMinutesDuration(nameOf0) {
  var minutes=new Array();
  if (nameOf0==null) nameOf0 = "-"
  minutes.push({id:0, bezeichnung:nameOf0});
  minutes.push({id:15, bezeichnung:'15 '+_("minutes")});
  minutes.push({id:30, bezeichnung:'30 '+_("minutes")});
  minutes.push({id:45, bezeichnung:'45 '+_("minutes")});
  minutes.push({id:60, bezeichnung:'1 '+_("hour")});
  minutes.push({id:90, bezeichnung:'1,5 '+_("hours")});
  minutes.push({id:120, bezeichnung:'2 '+_("hours")});
  minutes.push({id:150, bezeichnung:'2,5 '+_("hours")});
  minutes.push({id:180, bezeichnung:'3 '+_("hours")});
  minutes.push({id:240, bezeichnung:'4 '+_("hours")});
  minutes.push({id:300, bezeichnung:'5 '+_("hours")});
  minutes.push({id:360, bezeichnung:'6 '+_("hours")});
  minutes.push({id:60*8, bezeichnung:'8 '+_("hours")});
  minutes.push({id:60*12, bezeichnung:'12 '+_("hours")});
  minutes.push({id:60*24, bezeichnung:'1 '+_("day")});
  return minutes
}

function form_renderYesNo(nr, width) {
  if (width==null) width=24;
  if (nr==0)
    return form_renderImage({src:"delete_2.png",htmlclass:"clickable", width:width});
  else if (nr==1)
    return form_renderImage({src:"check-64.png",htmlclass:"clickable", width:width});
  else
    return form_renderImage({src:"attention.png",htmlclass:"clickable", width:width});
}


function form_getReminder(domainType, domainId) {
  if (masterData.reminder && masterData.reminder[domainType]
      && masterData.reminder[domainType][domainId]!=null
      && masterData.reminder[domainType][domainId]) {
    return masterData.reminder[domainType][domainId].toDateEn(true);
  }
  else return null;
}

function form_renderReminder(domainType, domainId) {
  var txt = "";
  if (settings.user.id > 0) {
    var icon = "reminder_sw";
    var dt = new Date();
    if (form_getReminder(domainType, domainId)!=null
           && form_getReminder(domainType, domainId).getTime() > dt.getTime()) {
      icon = "reminder";
    }
    txt = form_renderImage({data:[{name:"type", value: domainType}, {name:"id", value: domainId}],
                            cssid:"reminder", htmlclass:"reminder", label:"Erinnern", src: icon+".png", width:20});
  }
  return txt;
}

/**
 *
 * @param element JQuery element
 * @param beforeDate - eventDate or can be null
 * @param freeOption - freeOption shows a free date entry, otherwise duration from eventDate
 */
function form_editReminder(element, eventDate, freeOption) {
  var domainId = element.attr("data-id");
  var domainType = element.attr("data-type");
  var minutes = getMinutesDuration("Zum Zeitpunkt");
  if (freeOption == null) freeOption = false;
  if (!freeOption && eventDate == null) freeOption = true; // otherwise makes no sense
  var form = new CC_Form("Erinnerung für "+_(domainType));
  var currentDate = form_getReminder(domainType, domainId);
  if (currentDate && eventDate && !freeOption) {
    if (!churchcore_ObjectContainsElementWith(minutes, "id", (eventDate.getTime()-currentDate.getTime())/60000))
      freeOption = true;
  }
  else if (currentDate == null) currentDate = eventDate;

  if (!freeOption) {
    minutes.push({id:-1, bezeichnung:"Zeitpunkt selber wählen..."});
    form.addSelect({data: minutes, cssid:"reminddate",
                    selected: (eventDate.getTime()-currentDate.getTime()) / 60000,
                    sort: false, label: "Vorher erinnern"})
  }
  else {
    form.addInput({label: "Erinnern am", separator:"<nobr>",
                   controlgroup_start: true, cssid:"reminddate", type:"small",
                   value: currentDate.toStringDe()});
    form.addHtml("<div id=\"dp_date\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/>");
    form.addHtml("&nbsp;");
    form.addSelect({controlgroup: false, cssid: "remindhour", selected: currentDate.getHours(),
                   data: _getHoursArray(), type:"mini"});
    form.addHtml(" : ");
    form.addSelect({controlgroup_end: true, cssid: "remindmin", selected: currentDate.getMinutes(),
                    data:_getMinutesArray(), type:"mini"});
  }

  var elem = form_showDialog("Erinnerung anpassen", form.render(null, "horizontal"), 500, 450);
  elem.dialog("addbutton", _("save"), function() {
    var res = null;
    if (freeOption) {
      var s = $("#reminddate").val() + " " + $("#remindhour").val() + ":" + $("#remindmin").val();
      res = s.toDateDe(true);
    }
    else {
      res = new Date(eventDate.getTime() - $("#reminddate").val()*60000);
    }
    if (res == null || isNaN( res.getTime() )) alert(_("error.occured"));
    else {
      elem.dialog("close");
      churchInterface.jsendWrite({func: "saveReminder", domain_id: domainId, domain_type: domainType,
          reminddate: res}, function(ok, data) {
        if (!ok) alert(data);
        else {
          if (masterData.reminder == null) masterData.reminder = new Object();
          if (masterData.reminder[domainType] == null) masterData.reminder[domainType] = new Object();
          masterData.reminder[domainType][domainId] = res.toStringEn(true);
        }
      });
    }
  })
  if (form_getReminder(domainType, domainId) != null) {
    elem.dialog("addbutton", "Erinnerung entfernen", function() {
      if (masterData.reminder[domainType] != null && masterData.reminder[domainType][domainId]!=null) {
        delete masterData.reminder[domainType][domainId];
        churchInterface.jsendWrite({func: "saveReminder", domain_id: domainId, domain_type: domainType});
      }
      else alert(_("error.occured"));
      elem.dialog("close");
    });
  }
  elem.dialog("addcancelbutton");
  if (freeOption) {
    $("#reminddate").click(function() {
      form_implantDatePicker('dp_date', dt, function(dateText) {
        $("#reminddate").val(dateText);
        $("#reminddate").keyup();
      });
    });
  }
  else {
    $("#reminddate").change(function() {
      if ($(this).val()=="-1") {
        elem.dialog("close");
        var date = new Date(eventDate.getTime());
        date.setMinutes(date.getMinutes()-30);
        form_editReminder(element, date, true);
      }
    })
  }
}

/**
 * Rendert eine sch√∂ne Labelliste mit plus und trahsbox zeichen
 * Es mu√ü ein Div definiert sein, der so hei√üt wie name.
 * current=Object, was das Array [name] enth√§lt.
 * data=MasterData
 */
function form_renderLabelList(current, name, data) {
  if (current[name]==null) current[name]=new Array();
  var rows=new Array();
  each(churchcore_sortMasterData(data), function(k,a) {
    if (churchcore_inArray(a.id, current[name])) {
      rows.push('<span class="label label-default" title="id:'+a.id+'">');
      rows.push(a.bezeichnung+"&nbsp;");
      rows.push(form_renderImage({htmlclass:name+"-del", link:true, data:[{name:"id", value:a.id}], src:"trashbox.png", width:16}));
      rows.push('</span>&nbsp; ');
    }
  });
  rows.push(form_renderImage({src:"plus.png", width:20, cssid:name+'-add'}));
  var tag=$("#"+name);
  tag.html(rows.join(""));
  tag.find("#"+name+'-add').click(function() {
    tag.find("#"+name+'-add').remove();
    // Wenn es mehr als 99 Elemente sind mache ich einen Autocomplete, ansonsten Select-Box
    if (churchcore_countObjectElements(data)>99) {
      tag.append("<br/><br/>"+form_renderInput({controlgroup:false, type:"medium", cssid:"auto", htmlclass:"autocomplete"}));
      tag.find("input.autocomplete").autocomplete({
        source: function( request, response ) {
          var str=request.term;
          var r=new Array();
          each(data, function(k,a) {
            if ((!churchcore_inArray(a.id, current[name]))
                   && (a.bezeichnung.toUpperCase().indexOf(request.term.toUpperCase())>=0))
              r.push({label:a.bezeichnung, value:a.id});
          });
          response(r);
        },
        select: function(a,item) {
          current[name].push(item.item.value);
          form_renderLabelList(current, name, data);
        }
      }).focus();
    }
    else {
      tag.append(form_renderSelect({data:data, freeoption:true, controlgroup:false, func:function(a) {return !churchcore_inArray(a.id, arr);}}));
      tag.find("select").change(function() {
        current[name].push($(this).val());
        form_renderLabelList(current, name, data);
      });
    }
  });
  tag.find("a."+name+'-del').click(function() {
    var tagId=$(this).attr("data-id");
    each(current[name], function(k,a) {
      if (a==tagId) {
        current[name].splice(k,1);
        return false;
      }
    });
    form_renderLabelList(current, name, data);
  });
}

/*
 * label, value, func, elem
 */
function form_renderColorPicker(options) {
  var rows = new Array();
  rows.push('<div class="control-group">');
  rows.push('<label class="control-label">'+options.label+'</i></label>');
  rows.push('<div class="controls">');
  rows.push('<select name="colorpicker">'+
  '<option value="black">black</option>'+
  '<option value="#ac725e">#ac725e</option>'+
  '<option value="#d06b64">#d06b64</option>'+
  '<option value="#f83a22">#f83a22</option>'+
  '<option value="#fa573c">#fa573c</option>'+
  '<option value="#ff7537">#ff7537</option>'+
  '<option value="#ffad46">#ffad46</option>'+
  '<option value="#fbd75b">#fbd75b</option>'+
  '<option value="#D8F781">#D8F781</option>'+
  '<option value="#16a765">#16a765</option>'+
  '<option value="#7bd148">#7bd148</option>'+
  '<option value="#42d692">#42d692</option>'+
  '<option value="#92e1c0">#92e1c0</option>'+
  '<option value="#9fe1e7">#9fe1e7</option>'+
  '<option value="#9fc6e7">#9fc6e7</option>'+
  '<option value="#4986e7">#4986e7</option>'+
  '<option value="#9a9cff">#9a9cff</option>'+
  '<option value="#b99aff">#b99aff</option>'+
  '<option value="#c2c2c2">#c2c2c2</option>'+
  '<option value="#cabdbf">#cabdbf</option>'+
  '<option value="#cca6ac">#cca6ac</option>'+
  '<option value="#f691b2">#f691b2</option>'+
  '<option value="#cd74e6">#cd74e6</option>'+
  '<option value="#a47ae2">#a47ae2</option>'+
      '</select>');
  rows.push("</div></div>");
  test12=options.elem;
  options.elem.html(rows.join(""));
  options.elem.find('select[name="colorpicker"]').simplecolorpicker({picker: true, delay:200}).on('change', options.func);
  if (options.value!=null)
    options.elem.find('select[name="colorpicker"]').simplecolorpicker('selectColor', options.value);
}

function form_renderColor(color) {
  return '<span class="simplecolorpicker icon" '
            + 'title="'+color+'"style="background-color: '+color+'">&nbsp;</span>';
}
function form_renderColorCheckbox(color, textColor, checked) {
  check = checked ? "&#10004;" : "&nbsp;";
  return '<span class="simplecolorpicker icon' + (checked ? " checked" : "")
         + '" style="background-color: '+color+';color: '+textColor+';">'+check+'</span>';
}
function form_renderColorWithImage(color, src) {
  if (src.indexOf("/")==-1)
    src="system/churchcore/images/"+src;
  return '<span class="simplecolorpicker icon" title="'+color+'" style="background-size: 100%; background-repeat: no-repeat; background-color: '+color+'; background-image:url('+src+')">&nbsp;&nbsp;&nbsp;&nbsp;</span>';
}

/**
 *
 * @param options
 *   label, cssid, src, htmlclass, id, data
 * @return html code
 */
function form_renderImage(options) {
  var _text="";
  var controlgroup = (options.controlgroup==null?false:options.controlgroup);
  var controlgroup_class=(options.controlgroup_class==null?"control-group":options.controlgroup_class);
  var controlgroup_start=(options.controlgroup_start!=null && options.controlgroup_start);
  var controlgroup_end=(options.controlgroup_end!=null && options.controlgroup_end);
  var style="";
  if (options.width!=null) style=style+'max-width:'+options.width+'px;';
  if (options.top!=null) style=style+'margin-top:'+options.top+'px;';
  var src=options.src;
  if (src.indexOf("/")==-1)
    src="system/churchcore/images/"+src;
  if ((controlgroup_start) || (controlgroup_end)) controlgroup=false;

  if ((controlgroup) || (controlgroup_start))
    rows.push('<div class="'+controlgroup_class+'">');
  if ((controlgroup) || (controlgroup_start)) _text=_text+'<div class="controls">';

  if (options.label==null) options.label="";
  if (options.cssid==null) options.cssid="";
  var data="";
  if (options.data!=null) {
    each(options.data, function(k,a) {
      data=data+"data-"+a.name+"="+a.value+" ";
    });
  }
  var htmlclass=(options.htmlclass!=null?options.htmlclass:"");

  if (options.cssid!="" || options.link)
    _text=_text+"<a href=\"#\" "+data+"title=\""+options.label+"\" class=\""+htmlclass+"\" id=\""+options.cssid+"\"><img style=\""+style+"\" src=\""+src+"\" class=\""+htmlclass+"\"></a>";
  else
    _text=_text+"<img style=\""+style+"\" src=\""+src+"\" title=\""+options.label+"\" class=\""+htmlclass+"\">";


  if ((controlgroup) || (controlgroup_end)) _text=_text+'</div></div>';

  if (options.hover) {
    _text='<span class="hoverreactor">'+_text+'</span>';
  }

  return _text;
}

function form_renderPersonImage(url, width) {
  if (width==null) width=180;
  if (url==null) url="nobody.gif";
  return '<img style="max-width:'+width+'px;max-height:'+width+'px;" src="'+settings.files_url+"/fotos/"+url+"\"/>";
}

/**
 * Show a formular with can create person over churchdb
 * @param {[type]} value
 * @param {[type]} func
 */
function form_renderCreatePerson (value, func) {
  var form = new CC_Form();
  form.addHidden({cssid:"func", value:"createAddress"});
  form.addInput({label:"Vorname", cssid:"vorname", required:true, value:(value.indexOf(" ")>=0?value.substr(0,value.indexOf(" ")):"")});
  form.addInput({label:"Nachname", cssid:"name", required:true, value:(value.indexOf(" ")>=0?value.substr(value.indexOf(" ")+1,99):"")});
  form.addInput({label:"E-Mail", cssid:"email", value:(value.indexOf("@")>=0?value:"")});
  form.addSelect({label:"Bereich", cssid:"Inputf_dep", htmlclass:"setting", data:churchcore_sortMasterData(masterData.cdb_bereich), selected:masterData.settings.bereich_id});
  form.addSelect({label:"Status", cssid:"Inputf_status", htmlclass:"setting", data:churchcore_sortMasterData(masterData.cdb_status), selected:masterData.settings.status_id});
  form.addSelect({label:"Station", cssid:"Inputf_station", htmlclass:"setting", data:churchcore_sortMasterData(masterData.cdb_station), selected:masterData.settings.station_id});

  var elem=form_showDialog(_("add.new.person"), form.render(null, "horizontal"), 500, 400);
  elem.dialog("addbutton", _("add"), function() {
    var obj=form.getAllValsAsObject();
    if (obj!=null) {
      if ((obj.vorname=="") || (obj.name=="")) {
        alert("Bitte Vorname und Name angeben!");
        return;
      }
      churchInterface.jsendWrite(obj, function(ok,data) {
        if (ok) {
          func(data.id, obj.vorname+" "+obj.name);
          elem.dialog("close");
        }
        else {
          alert(data);
        }
      }, null, false, "churchdb");
    }
  });
  elem.dialog("addcancelbutton");
  elem.find("select.setting").change(function(k) {
    masterData.settings[$(this).attr("id")]=$(this).val();
    churchInterface.jsendWrite({func:"saveSetting", sub:$(this).attr("id"), val:$(this).val()}, null, null, false);
  });
};

/**
 *
 * @param divid
 * @param withMyDeps - In addition get people which are in you deps. otherwise only visible people
 * @param func
 */
function form_autocompletePersonSelect (divid, withMyDeps, func) {
  if (withMyDeps==null) withMyDeps=false;
  $(divid).addClass("form-autocomplete");

  var auto=$(divid).autocomplete({
    search: function(event, ui) {
      $(divid).addClass("throbbing");
    },
    source: function( request, response ) {
      var str=request.term;
      var addStr="";
      if (str.lastIndexOf(",")>0) {
        str=str.substr(str.lastIndexOf(",")+1,99);
        addStr=request.term.substr(0,request.term.lastIndexOf(",")+1)+" ";
      }
      churchInterface.jsendRead({func: "getPersonByName", searchpattern: $.trim(str), withmydeps:withMyDeps}, function (ok, json) {
        $(divid).removeClass("throbbing");
        if (json.result=="ok") {
          if (json.data!=null) {
            response($.map(json.data, function(item) {
              return {
                label: item.name, value: addStr+item.id, imageurl: item.imageurl, shortname:item.shortname
              };
            }));
          }
          else {
            response(null);
          }

        }
      }, null, null, "churchdb");
    },
    minLength: 2,
    select: func
  });
  if (auto.data( "autocomplete" )!=null)
    auto.data( "autocomplete" )._renderItem = function( ul, item ) {
      return $( "<li>" ).data( "item.autocomplete", item )
        .append( '<a style="height:42px"><span style="width:48px;float:left;"> ' + form_renderPersonImage(item.imageurl,42) + '</span>'+ item.label + "</a>" )
        .appendTo( ul );
    };
};

/**
 *
 * @param elem
 * @param options
 * deselectable: Mit Klick kann man das Ding wieder deselektieren. StandardmÔøΩÔøΩig nicht mÔøΩglich!
 */
function form_renderSelectable(elem, options) {
  var rows = new Array();

  var height=(options.height==null?"":"height:"+options.height+"px;");
  var min_element_height=(options.min_element_height==null?"":"min-height:"+options.min_element_height+'px;');
  rows.push('<div style="'+height+'"><ul class="ui-menu ui-widget ui-widget-content ui-corner-all" style="'+height+' width:99%; overflow-y:auto; -webkit-overflow-scrolling: touch" id="'+options.cssid+'">');

  if (options.data!=null) {
    each(options.data, function(k,a) {
      var htmlclass="ui-corner-all";
      if (a.htmlclass!=null)
        htmlclass=htmlclass+" "+a.htmlclass;
      rows.push('<li class="ui-menu-item" data-id="'+a.id+'"><p style="margin:0 0 5px"><a href="#" data-id="'+a.id+'" class="'+htmlclass+'" style="'+min_element_height+'">');
      rows.push(a.bezeichnung+'</a>');
    });
  }
  rows.push("</ul></div>");

  elem.html(rows.join(""));
  if (options.selected!=null) {
    elem.find("a[data-id="+options.selected+"]").addClass("ui-state-hover");

    //$("span.personen").find("ul").scrollTop(45*10);
  }


  elem.find("a").click(function(a) {
    var id=$(this).attr("data-id");
    // Wenn das schon selektiert ist, dann wieder wegnehmen!
    if ((options.deselectable==true) && ($(this).hasClass("ui-state-hover"))) {
      $(this).removeClass("ui-state-hover");
      if (options.deselect!=null) {
        options.deselect();
      }
    }
    else {
      if (options.select!=null) {
        options.select(id);
      }
      elem.find("a").each(function() {
        if (($(this).attr("data-id")!=id) && ($(this).hasClass("ui-state-hover"))) {
          $(this).removeClass("ui-state-hover");
        }
      });
      $(this).addClass("ui-state-hover");
    }
    return false;
  });

  // Anfahren!
  if ((options.selected!=null) && (elem.find("li[data-id="+options.selected+"]").position()!=null)) {
    if (options.animate)
      elem.find("ul").animate({scrollTop: elem.find("li[data-id="+options.selected+"]").position().top-elem.position().top-3, duration:200});
    else
      elem.find("ul").scrollTop(elem.find("li[data-id="+options.selected+"]").position().top-elem.position().top-3);
  }
}

/**
 * @param options
 * checked : default false
 * label
 * cssid
 * disabled
 * controlgroup siehe input
 * @return html-code
 */
function form_renderCheckbox(options) {
  if (debug) console.log(options);
  var rows = new Array();
  var label = (options.label!=null?options.label:"");
  var htmlclass=(options.htmlclass!=null?" "+options.htmlclass:"");
  var controlgroup = (options.controlgroup==null) || (options.controlgroup);
  var controlgroup_class=(options.controlgroup_class==null?"control-group":options.controlgroup_class);
  var controlgroup_start=(options.controlgroup_start!=null && options.controlgroup_start);
  var controlgroup_end=(options.controlgroup_end!=null && options.controlgroup_end);
  if ((controlgroup_start) || (controlgroup_end)) controlgroup=false;

  if ((controlgroup) || (controlgroup_start))
    rows.push('<div class="'+controlgroup_class+'">');
  if ((controlgroup) || (controlgroup_start)) rows.push('<div class="controls">');

  data="";
  if (options.data!=null) {
    each(options.data, function(k,a) {
      data=data+"data-"+a.name+"="+a.value+" ";
    });
  }

  if (label!="") rows.push('<label class="checkbox" for="'+options.cssid+'">');

  rows.push('<input '+data+' type="checkbox" class="checkbox'+htmlclass+'" '+(options.cssid!=null?'id="'+options.cssid+'"':''));
  if ((options.checked!=null) && (options.checked))
    rows.push(" checked");
  if ((options.disabled!=null) && (options.disabled==true))
    rows.push(" disabled=yes");
  rows.push('/> '+label);
  if (label!="") rows.push('</label>');

  if ((controlgroup) || (controlgroup_end)) rows.push('</div></div>');

  return rows.join("");
}

/**
 * @param options
 * lable = Label
 * cssid = id
 * htmlclass
 * @return html-code
 */

function form_renderButton (options) {
  var cssid = (options.cssid!=null?'id="'+options.cssid+'"':"");
  var btn_type = (options.type!=null?' btn-'+options.type:"");
  var htmlclass=(options.htmlclass!=null?" "+options.htmlclass:"");
  var disabled=(options.disabled!=null && options.disabled?' disabled="true"':"");

  var rows = new Array();
  if ((options.controlgroup!=null) && (options.controlgroup))
    rows.push('<div class="control-group"><div class="controls">');

  rows.push('<input type="button" class="btn'+btn_type+htmlclass+'" '+cssid+' value="'+options.label+'"'+disabled+'"/>');

  if ((options.controlgroup!=null) && (options.controlgroup))
    rows.push('</div></div>');

  return rows.join("");
}


/**
 * @param options
 * value = Vorgabe-Text
 * lable = Label
 * size = default:10
 * separator = default:" " (Spielt nur eine Rolle, wenn Controlgroup=false ist
 * cssid = id
 * htmlclass = class
 * disabled = default:false
 * type = small, medium, large (standard)
 * password = default:false
 * email = default:false
 * controlgroup = bootstrap div controlgroup, default is true
 * maxlength
 * required = default:false
 * controlgroup_start
 * controlgroup_end
 * placeholder
 * @return html-code
 */
function form_renderInput (options) {
  var value = "";
  if (options.value != null) {
    if (typeof options.value == "string") value = options.value.replace(/"/g, "&quot;");
    else value = options.value;
  }
  var size = (options.size!=null?size:10);
  var disabled = ((options.disabled!=null) && (options.disabled)?"disabled":"");
  var separator = (options.separator!=null?options.separator:" ");
  var controlgroup = (options.controlgroup==null) || (options.controlgroup);
  if (options.controlgroup_start!=null) controlgroup=false;
  if (options.controlgroup_end!=null) controlgroup=false;
   var cssid = (options.cssid!=null?'id="'+options.cssid+'"':"");

  if (options.type!=null) {
    if (options.htmlclass==null) options.htmlclass="";
    options.htmlclass=options.htmlclass+" input-"+options.type;
  }
  var placeholder = (options.placeholder!=null?options.placeholder:"");


  var rows = new Array();
  if ((controlgroup) || (options.controlgroup_start!=null)) rows.push('<div class="control-group">');

  if (options.label!=null) {
    rows.push('<label class="control-label" '+(cssid!=""?'for="'+options.cssid+'"':"")+'>'+options.label);
    if (options.required) rows.push(' <span class="required">*</span>');
    rows.push('</label>');
  }

  if ((controlgroup) || (options.controlgroup_start!=null)) rows.push('<div class="controls">');
  else if (options.label!=null) rows.push(separator);

  if (placeholder==null) placeholder="";
  rows.push('<input type="');
  var type="text";
  if ((options.password!=null) && (options.password)) type="password";
  else if ((options.email!=null) && (options.email)) type="email";
  rows.push(type);
  rows.push('" size="'+size+'" '+cssid+' placeholder="'+placeholder+'" ');
  if (options.htmlclass!=null) rows.push('class="'+options.htmlclass+'" ');
  if (options.maxlength!=null) rows.push('maxlength="'+options.maxlength+'" ');
  rows.push(disabled+' value="'+value+'"/>');

  if (options.datepicker!=null) {
    rows.push('<div id="'+options.datepicker+'" style="position:absolute;background:#e7eef4;z-index:12001;"/>');
  }

  if ((controlgroup) || (options.controlgroup_end!=null)) rows.push('</div></div>');
  return rows.join("");
};

/**
 *
 * @param id
 * @param label
 * @param data
 * @param cols
 * @param rows
 * @param maxlength
 * @param disabled
 * placeholder
 * separator default <td>
*/
function form_renderTextarea(options) {
  var label='';
  var diabletxt="";
  var data='';
  var placeholder='';
  var rows = new Array();
  if (options.placeholder!=null) placeholder=options.placeholder;
  if (options.data!=null) data=options.data;
  if (options.label!=null) label=options.label;
  var controlgroup = (options.controlgroup==null) || (options.controlgroup);
  if (options.type!=null) {
    if (options.htmlclass==null) options.htmlclass="";
    options.htmlclass=options.htmlclass+" input-"+options.type;
  }
  var htmlclass = (options.htmlclass!=null?'class='+options.htmlclass:"");

  if ((options.disabled!=null) && (options.disabled)) disabletxt="disabled";

  if (controlgroup) rows.push('<div class="control-group">');
  rows.push('<label class="control-label" for="'+options.cssid+'">'+label+'</i></label>');

  if (controlgroup) rows.push('<div class="controls">');
  else if (options.label!=null) {
    if (options.separator!=null)
      rows.push(separator);
    else
      rows.push("<td>");
  }
  rows.push('<textarea '+htmlclass+' type="text" placeholder="'+placeholder+'" ');
  if (options.maxlength!=null) rows.push('maxlength="'+options.maxlength+'" ');
  rows.push('cols="'+options.cols+'" rows="'+options.rows+'" id="'+options.cssid+'" disabletxt'+'>'+data+"</textarea>");
  if (controlgroup) rows.push('</div></div>');

  return rows.join("");

}

function form_renderHidden(options) {
  return '<input type="hidden" name="'+options.name+'" id="'+options.cssid+'" value="'+options.value+'"/>';
}

function form_renderCaption(options) {
  return form_renderLabel(options.text, options.label);
}

function form_renderLabel(txt, hint) {
  var rows = new Array();
  if (hint!=null) {
    rows.push('<div class="control-group">');
    rows.push('<label class="control-label">'+hint+'</i></label>');
  }
  rows.push('<div class="controls">'+txt+'</div>');
  if (hint!=null)
    rows.push("</div>");

  return rows.join("");
}


function form_prepareDataEntry(id, bezeichnung, sortkey) {
  var entry = new Object();
  entry.id=id;
  entry.bezeichnung=bezeichnung;
  if (sortkey!=null) entry.sortkey=sortkey;
  return entry;
}

/**
 * data: array mit id und bezeichnung
 * sort: default true
 * label: Title
 * separator: default " "
 * cssid: cssid
 * fields: weitere Felder fÔøΩr Dateninhalte, e.g. {test:"jo", id:123}
 * htmlclass: html-klasse
 * disabled: default false
 * freeoption: default false (ein leere Option)
 * selected: vorauswahl
 * controlgroup: default true (ob es ein bootstrap div-control-group wird, v.a. fÔøΩr formular-horizontal wichtig)
 * controlgroup_start: default false, wenn true, dann wird controlgroup auf false gesetzt
 * controlgroup_end
 * type: small, medium, large (default)
 * func:
 * html: wird nach dem /select hinzugfefÔøΩgt
 * multiple: default false
 * @param options
 * @return txt
 */
function form_renderSelect (options) {
  var separator = (options.separator!=null?options.separator:" ");
  var controlgroup=(options.controlgroup==null) || (options.controlgroup);
  if (options.controlgroup_start!=null) controlgroup=false;
  if (options.controlgroup_end!=null) controlgroup=false;

  var multiple = ( options.multiple != null && options.multiple ? " multiple" : "" );
  var fields="";
  if (options.fields != null) {
    each(options.fields, function(k, a) {
      fields = fields + " " + k + '="' + a + '"';
    });
  }


  var rows=new Array();
  if ((controlgroup) || (options.controlgroup_start!=null)) rows.push('<div class="control-group">');

    if (options.label!=null) {
      //if (controlgroup)
        rows.push('<label class="control-label" for="'+options.cssid+'">'+options.label+'</i></label>');
     // else
        rows.push(separator);
    }

    var cssid="";
    if (options.cssid!=null)
      cssid='id="'+options.cssid+'"';

    var htmlclass="";
    if (options.htmlclass!=null)
      htmlclass=options.htmlclass;
    if (options.type!=null)
      htmlclass=htmlclass+" input-"+options.type;

    if ((controlgroup) || (options.controlgroup_start!=null)) rows.push('<div class="controls">');

    if ((options.disabled!=null) && (options.disabled))
      rows.push("<select "+cssid+' class="'+htmlclass+'" '+fields+' disabled="true"'+multiple+'>');
    else
      rows.push("<select "+cssid+' class="'+htmlclass+'" '+fields+multiple+'>');

    if ((options.freeoption!=null) && (options.freeoption))
     rows.push('<option value=""/>');

    if (options.data!=null) {
      each((options.sort==null || options.sort?churchcore_sortMasterData(options.data):options.data), function (k,a) {
        if ((typeof options.func !="function") || (options.func(a))) {
          if ((options.selected!=null) && (a.id==options.selected))
            rows.push("<option selected value=\""+a.id+"\">"+a.bezeichnung+"</option>");
          else
            rows.push("<option value=\""+a.id+"\">"+a.bezeichnung+"</option>");
        }
      });
    }
    rows.push("</select>");
    if (options.html!=null) rows.push(options.html);
    if ((controlgroup) || (options.controlgroup_end!=null)) rows.push('</div></div>');

  return rows.join("");
};


function form_getDateFromForm(id) {
  var d = $("#"+id+"date").val();
  if ($("#"+id+"hour").val()!=null) d=d+" "+$("#"+id+"hour").val()+":"+$("#"+id+"minutes").val();
  return new Date(d.toDateDe(true));
}


function _getMinutesArray() {
  var minutes = new Array();
  form_addEntryToSelectArray(minutes, 0, "00");
  form_addEntryToSelectArray(minutes, 15, "15");
  form_addEntryToSelectArray(minutes, 30, "30");
  form_addEntryToSelectArray(minutes, 45, "45");
  return minutes;
}
function _getHoursArray() {
  var hours = new Array();
  for (var i=0;i<24;i++) {
    form_addEntryToSelectArray(hours, i, i, i);
  }
  return hours;
}

$.widget("ct.renderCCEvent", {
  options: {
    name : "renderCCEvent",
    event : null,
    beforeChange: function() { return true; }
  },

  _create: function() {
    var t = this;
    t.render();
  },

  _checkExceptionCollision: function() {
    var t = this;
    var data = t.options.event;
    var collision=false;
    if (data.exceptions!=null) {
      each(data.exceptions, function(k,e) {
        if (churchcore_datesInConflict(data.startdate, data.enddate, e.except_date_start.toDateEn(true), e.except_date_end.toDateEn(true))) {
          collision=k;
          return false;
        }
      });
    }
    if (collision!==false && confirm("Es gibt eine Ausnahme an dem Datum, soll die entfernt werden?")) {
      delete data.exceptions[collision];
      t.render();
    }
  },

  _render: function() {
    var t = this;
    var rows= new Array();

    var event = t.options.event;

    var authexceptions=(t.options.authexceptions==null?true:t.options.authexceptions);
    var authadditions=(t.options.authadditions==null?true:t.options.authadditions);
    var disabled=(t.options.disabled!=null) && (t.options.disabled==true);

    var allDayAllowed = (t.options.allDayAllowed == null || t.options.allDayAllowed );
    var repeatsAllowed = (t.options.repeatsAllowed == null || t.options.repeatsAllowed );

    var minutes = _getMinutesArray();
    var hours = _getHoursArray();

    var allDay=churchcore_isAllDayDate(event.startdate, event.enddate);
    var rows=new Array();
    if (allDayAllowed) {
      rows.push(form_renderCheckbox({
        label:" "+_("all.day"),
        controlgroup:true,
        cssid:"inputAllDay",
        checked:allDay,
        disabled:disabled
      }));
    }

    if (allDay) {
      rows.push(form_renderInput({
        cssid:"inputStartdate",
        label:_("start.date"),
        controlgroup:true,
        value:event.startdate.toStringDe(),
        disabled:disabled,
        type:"small"
      }));
      rows.push("<div id=\"dp_startdate\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/>");
    }
    else {
      rows.push(form_renderInput({
        cssid:"inputStartdate",
        label:_("start.date"),
        controlgroup_start:true,
        separator:"<nobr>",
        value:event.startdate.toStringDe(),
        disabled:disabled,
        type:"small"
      })+"&nbsp;");
      rows.push("<div id=\"dp_startdate\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/>");

      rows.push(form_renderSelect({
        data:hours,
        cssid:"inputStarthour",
        selected:event.startdate.getHours(),
        htmlclass:"input-mini",
        disabled:disabled,
        controlgroup:false
      })+" : ");

      rows.push(form_renderSelect({
        data:minutes,
        cssid:"inputStartminutes",
        selected:event.startdate.getMinutes(),
        type:"mini",
        disabled:disabled,
        controlgroup_end:true
      }));
    }
    rows.push("</nobr>");

    if (allDay) {
      rows.push(form_renderInput({
        cssid:"inputEnddate",
        label:_("end.date"),
        controlgroup:true,
        value:event.enddate.toStringDe(),
        disabled:disabled,
        type:"small"
      }));
      rows.push("<div id=\"dp_enddate\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/>");
    }
    else {
      rows.push(form_renderInput({
        cssid:"inputEnddate",
        label:_("end.date"),
        controlgroup_start:true,
        separator:"<nobr>",
        value:event.enddate.toStringDe(),
        disabled:disabled,
        type:"small"
      })+"&nbsp;");
      rows.push("<div id=\"dp_enddate\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/>");

      rows.push(form_renderSelect({
        data:hours,
        cssid:"inputEndhour",
        selected:((event.enddate.getHours()==0)?11:event.enddate.getHours()),
        htmlclass:"input-mini",
        disabled:disabled,
        controlgroup:false
      })+" : ");

      rows.push(form_renderSelect({
        data:minutes,
        cssid:"inputEndminutes",
        selected:event.enddate.getMinutes(),
        type:"mini",
        disabled:disabled,
        controlgroup_end:true
      }));
    }
    rows.push("</nobr>");


    // REPEATS
    if (!repeatsAllowed)
      rows.push(form_renderHidden({cssid:"inputRepeat_id", value:"0"}));
    else {

      rows.push(form_renderSelect({
        data:masterData.repeat,
        cssid:"inputRepeat_id",
        selected:event.repeat_id,
        disabled:disabled,
        type:"big",
        label:_("repeats")
      }));

      rows.push('<div id="repeats_select">');

      if ((event.repeat_id!=null) && (event.repeat_id>0)) {
        if ((event.repeat_frequence==null) || (event.repeat_frequence==0))
          event.repeat_frequence=1;

        if (event.repeat_id==32) {
          var r = new Array();
          var d = dayNames[event.startdate.getDay()]+" im Monat";
          r.push(form_prepareDataEntry(1,"Erster "+d,1));
          r.push(form_prepareDataEntry(2,"Zweiter "+d,2));
          r.push(form_prepareDataEntry(3,"Dritter "+d,3));
          r.push(form_prepareDataEntry(4,"Vierter "+d,4));
          r.push(form_prepareDataEntry(5,"F&uuml;nter "+d+" (falls vorhanden)",5));
          r.push(form_prepareDataEntry(6,"Letzter "+d,6));
          if (event.repeat_option_id==null) {
            var tester=new Date(event.startdate);
            tester.setDate(0);
            var counter=0;
            while (tester<event.startdate) {
              tester.addDays(1);
              if (tester.getDay()==event.startdate.getDay()) counter=counter+1;
            }
            repeat_option_id=counter;
          }
          rows.push(form_renderSelect({
            data:r,
            cssid:"inputRepeatOptionId",
            disabled:disabled,
            selected:event.repeat_option_id,
            type:"medium",
            label:""
          }));
        }

        if (event.repeat_id!=999) {
          rows.push('<div class="control-group"><label class="control-label"></label>');
          rows.push('<div class="controls">');
          rows.push('alle&nbsp;');
          rows.push(form_renderInput({
            value:event.repeat_frequence,
            disabled:disabled,
            controlgroup:false,
            cssid:"inputRepeatFrequence",
            type:"xxmini"}));
          if (event.repeat_until==null) {
            event.repeat_until=new Date(event.startdate);
            event.repeat_until.addDays(event.repeat_id*7-1);
          }
        }
        if (event.repeat_id==1)
          rows.push("&nbsp;Tag(e) bis&nbsp;");
        else if (event.repeat_id==7)
          rows.push("&nbsp;Woche(n) bis&nbsp;");
        else if (event.repeat_id==31)
          rows.push("&nbsp;Monat(e) bis&nbsp;");
        else if (event.repeat_id==32)
          rows.push("&nbsp;Monat(e) bis&nbsp;");
        else if (event.repeat_id==365)
          rows.push("&nbsp;Jahr(e) bis&nbsp;");
        if (event.repeat_id!=999) {
          if ((event.repeat_until==null) || (event.repeat_until.getFullYear()==1899)) {
            event.repeat_until=new Date(event.startdate);
            event.repeat_until.addDays(event.repeat_id*1);
          }
          rows.push(form_renderInput({
            value: event.repeat_until.toStringDe(),
            controlgroup: false,
            disabled: disabled,
            cssid: "inputRepeatUntil",
            type: "small"}));
          rows.push("<div id=\"dp_repeatuntil\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/></div></div>");
        }

      // AUSNAHMEN

      if (event.repeat_id>0) {
        rows.push('<div id="repeats_exceptions">');
        rows.push('<div class="control-group"><label class="control-label">Ausnahmen</label>');
        rows.push('<div class="controls">');
        if (event.exceptions!=null) {
          each(churchcore_sortData(event.exceptions, "exception_start_date"), function(k,a) {
            rows.push('<span class="label label-default" title="id:'+a.id+'">');
            if (a.except_date_end!=a.except_date_start) {
              rows.push(a.except_date_start.toDateEn().toStringDe()+"-"+a.except_date_end.toDateEn().toStringDe()+"&nbsp;");
            }
            else
              rows.push(a.except_date_start.toDateEn().toStringDe()+"&nbsp;");

            if (authexceptions)
              rows.push(form_renderImage({src:"trashbox.png",width:16, cssid:"delException"+a.id}));

            rows.push('</span>&nbsp; ');
          });
        }
        if ((authexceptions) && (!disabled)) {
          rows.push(form_renderImage({src:"plus.png", width:20, cssid:"addException"}));
          rows.push("<div id=\"dp_addexception\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/></div></div>");
        }
        rows.push('</div></div>');
        rows.push('</div>');
      }


        // MANUELLE TERMINE

        if (((event.repeat_id>0) && (event.repeat_id!=1)) || (event.additions!=null)) {
          rows.push('<div id="repeats_addition">');
            rows.push('<div class="control-group"><label class="control-label">Weitere Termine</label>');
            rows.push('<div class="controls">');
            if (event.additions!=null) {
              each(churchcore_sortData(event.additions, "add_date"), function(k,a) {
                rows.push('<span class="label label-default" title="id:'+a.id+'">');
                rows.push(a.add_date.toDateEn().toStringDe()+"&nbsp;");

                var image="recurring_bw.png";
                if (a.with_repeat_yn==1) image="recurring.png";

                if (authadditions)
                  rows.push(form_renderImage({src:image,width:16, label:"Soll der manuelle Termin auch wiederholt werden", cssid:"changeAdditionRepeat"+(1-a.with_repeat_yn)+a.id}));
                else
                  rows.push(form_renderImage({src:image,width:16}));

                if (authadditions)
                  rows.push(form_renderImage({src:"trashbox.png",width:16, label:"Entferne den manuellen Termin", cssid:"delAddition"+a.id}));

                rows.push('</span>&nbsp; ');
              });
            }
            if ((authadditions) && (!disabled)) {
              rows.push(form_renderImage({src:"plus.png", width:20, cssid:"addAddition"}));
              rows.push("<div id=\"dp_addaddition\" style=\"position:absolute;background:#e7eef4;z-index:8001;\"/></div></div>");
            }
            rows.push('</div></div>');
          rows.push("</div>");
        }
      }
    }

    rows.push("</div>");
    this.element.html(rows.join(""));
  },



  render: function() {
    var t = this;
    if (debug) console.log(t.options);

    t._render();

    // CALLBACKS
    var event = t.options.event;

    $('#inputAllDay').change(function(c) {
      if (t.options.beforeChange()) {
        if ($(this).attr("checked")=="checked") {
          event.startdate.setHours(0);
          event.startdate.setMinutes(0);
          event.enddate.setHours(0);
          event.enddate.setMinutes(0);
        }
        else {
          event.startdate.setHours(10);
          event.enddate.setHours(11);
        }
      }
      t.render();
    });

    $("#inputStartdate").click(function() {
      if (t.options.beforeChange()) {
        form_implantDatePicker('dp_startdate', event.startdate, function(dateText) {
          $("#inputStartdate").val(dateText);
          $("#inputStartdate").keyup();
        });
      }
    });
    $("#inputEnddate").click(function() {
      if (t.options.beforeChange()) {
        form_implantDatePicker('dp_enddate', t.options.event.enddate, function(dateText) {
          $("#inputEnddate").val(dateText);
          $("#inputEnddate").keyup();
        });
      }
    });
    $("#inputStartdate").keyup(function() {
      if (!t.options.beforeChange()) t.render();
      else {
        if ($("#inputStartdate").val().isGermanDateFormat()) {
          $("#inputEnddate").val($("#inputStartdate").val());
          form_getDatesInToObject(t.options.event);
          t.options.event.repeat_option_id=null;
          t.render();
          t._checkExceptionCollision();
        }
      }
    });
    $("#inputEnddate").keyup(function() {
      if (!t.options.beforeChange()) t.render();
    });
    $("#inputStarthour").change(function() {
      if (t.options.beforeChange()) {
        event.startdate.setHours($("#inputStarthour").val());
        if (form_getDateFromForm("inputStart")>=form_getDateFromForm("inputEnd")) {
          event.enddate.setHours($("#inputStarthour").val()*1+1);
          t.render();
        }
      } else t.render();
    });
    $("#inputStartminutes").change(function() {
      if (!t.options.beforeChange()) t.render();
    });
    $("#inputEndhour").change(function() {
      if (t.options.beforeChange()) {
        if (form_getDateFromForm("inputStart")>=form_getDateFromForm("inputEnd"))
          $("#inputStarthour").val($("#inputEndhour").val()*1-1);
      }
      else t.render();
    });
    $("#inputEndminutes").change(function() {
      if (!t.options.beforeChange()) t.render();
    });

    $('#repeats_exceptions a').click(function() {
      if (!t.options.beforeChange()) t.render();
      else {
        if ($(this).attr("id").indexOf("delException")==0) {
          var exc=event.exceptions[$(this).attr("id").substr(12,99)];
          delete event.exceptions[exc.id];
          t.render();
          return false;
        }
        else if ($(this).attr("id")=="addException") {
          form_getDatesInToObject(event);
          form_implantDatePicker('dp_addexception', event.startdate, function(dateText) {
            event.addException(dateText.toDateDe());
            t.render();
          }, function(chose) {
            var select=false;
            each(churchcore_getAllDatesWithRepeats(event), function(a,ds) {
              if ((ds.startdate.toStringEn(false).toDateEn(false).getTime()==chose.getTime()))
                select=true;
            });
            return [select];
          });

          return false;
        }
      }
    });
    $('#repeats_addition a').click(function() {
      if (!t.options.beforeChange()) t.render();
      else {
        if ($(this).attr("id").indexOf("delAddition")==0) {
          var add=t.options.event.additions[$(this).attr("id").substr(11,99)];
          delete t.options.event.additions[add.id];
          t.render();
          return false;
        }
        else if ($(this).attr("id").indexOf("changeAdditionRepeat")==0) {
          var add=t.options.event.additions[$(this).attr("id").substr(21,99)];
          t.options.event.additions[add.id].with_repeat_yn = $(this).attr("id").substr(20,1);
          t.render();
          return false;
        }
        else if ($(this).attr("id")=="addAddition") {
          form_getDatesInToObject(t.options.event);
          form_implantDatePicker('dp_addaddition', t.options.event.startdate, function(dateText) {
            if (t.options.event.additions==null) t.options.event.additions=new Object();
            if (t.options.event.exceptionids==null) t.options.event.exceptionids=0;
            t.options.event.exceptionids=t.options.event.exceptionids-1;
            t.options.event.additions[t.options.event.exceptionids]
                  ={id:t.options.event.exceptionids, add_date:dateText.toDateDe().toStringEn(), with_repeat_yn:1};
            t.render();
          }, function(chose) {
            var select=chose>event.startdate;
            each(churchcore_getAllDatesWithRepeats(t.options.event), function(a,ds) {
              if ((ds.startdate.toStringEn(false).toDateEn(false).getTime()==chose.getTime()))
                select=false;
            });
            return [select];
          });

          return false;
        }
      }
    });


    $('#inputRepeat_id').change(function(c) {
      if (!t.options.beforeChange()) t.render();
      else {
        form_getDatesInToObject(t.options.event);
        t.render();
        $("#cdb_dialog").animate({scrollTop:135}, '500');
      }
    });
    $("#inputRepeatUntil").click(function() {
      if (!t.options.beforeChange()) t.render();
      else {
        form_getDatesInToObject(t.options.event);
        form_implantDatePicker('dp_repeatuntil', t.options.event.repeat_until, function(dateText) {
          $("#inputRepeatUntil").val(dateText);
        });
      }
    });
    $("#inputRepeatUntil").change(function() {
      if (!t.options.beforeChange()) t.render();
      else {
        form_getDatesInToObject(t.options.event);
        if (t.options.event.repeat_until.getFullYear()>3000) {
          t.options.event.repeat_until=new Date();
          $("#inputRepeatUntil").val(t.options.event.repeat_until.toStringDe());
        }
      }
    });
    $("#inputRepeatFrequence").click(function() {
      if (!t.options.beforeChange()) t.render();
    });
    $("#inputRepeatFrequence").change(function() {
      if (!t.options.beforeChange()) t.render();
      else {
        if (($("#inputRepeatFrequence").val()=="0") || ($("#inputRepeatFrequence").val()==""))
          $("#inputRepeatFrequence").val("1");
      }
    });

    if (t.options.callback!=null)
      t.options.callback();

  },

  getCCEvent : function() {
    form_getDatesInToObject(this.options.event);
    return this.options.event;
  }
});

function form_getDatesInToObject(o) {
  o.startdate=form_getDateFromForm("inputStart");
  o.enddate=form_getDateFromForm("inputEnd");
  o.repeat_id=$("#inputRepeat_id").val();
  o.repeat_until=$("#inputRepeatUntil").val();
  if (o.repeat_until!=null)
    o.repeat_until=o.repeat_until.toDateDe();
  o.repeat_frequence=$("#inputRepeatFrequence").val();
  o.repeat_option_id=$("#inputRepeatOptionId").val();
}

// smallmenu=false / true / null(gar kein menu!)
function form_implantWysiwygEditor(id, smallmenu, inline) {
  if (!churchcore_isObjectEmpty($("#"+id))) {
    if ((smallmenu==false))
      toolbar= [
                { name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [/* 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord',*/ '-', 'Undo', 'Redo' ] },
                { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', /*'Strike', 'Subscript', 'Superscript', */'-', 'RemoveFormat' ] },
                { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                { name: 'links', items: [ 'Link', 'Unlink'] },
                { name: 'insert', items: [ 'Image', 'Smiley', 'Table'] },
                { name: 'serienfeld', items: [ 'vorname', 'spitzname', 'nachname' ] }
              ];
    else if (smallmenu==true) {
      toolbar= [
                { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', /*'Strike', 'Subscript', 'Superscript', */'-', 'RemoveFormat' ] },
                { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                { name: 'insert', items: [ 'Image', 'Smiley', 'SpecialChar'] }
              ];
    }
    else if (smallmenu==null) {
      toolbar= [
                { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Underline', 'Link', 'Unlink'] }
              ];
    }
    CKEDITOR.config.extraPlugins = 'churchtools';
    if ((inline==null) || (inline==false))
      CKEDITOR.replace( id, {toolbar : toolbar});
    else
      CKEDITOR.inline( id, {toolbar : toolbar});
  }
}

/**
 * data [id,bezeichnung]
 * @param data
 */
function CC_MultiSelect(data, func) {
  this.selected=new Array();
  this.func=func;
  this.data=data;
  this.allSelected=true;
  // ZusÔøΩtztliche Aufruffunktionen, wie "Nur Mitglieder"
  this.addFunctions=new Array();
}

CC_MultiSelect.prototype.isSelected = function(id) {
  if ((this.selected.length==0) || (id==null)) return false;
  if (churchcore_inArray(id, this.selected))
    return true;
  else
    return false;
};

CC_MultiSelect.prototype.render2Div = function(divid, options) {
  var this_object=this;
  if (options==null) options= new Object();
  var rows = new Array();
  var controlgroup=(options.controlgroup==null) || (options.controlgroup);
  if (controlgroup) rows.push('<div class="control-group">');

  rows.push('<label for="'+options.cssid+'">'+options.label+'</label>');

  if (controlgroup) rows.push('<div class="control">');

  var label="";

  var count=0;
  if (this.data!=null) {
    each(this.data, function(k,a) {
      if ((a!=null) && (a.bezeichnung!='-')) count++;
    });
  }

  if (this.selected.length==0)
    label=_("none.selected");
  else if (this.selected.length==1)
    label=this.data[this.selected[0]].bezeichnung;
  else if (this.selected.length==count) {
    label=_("all.selected");
    this_object.allSelected=false;
  }
  else
    label=this.selected.length+" "+_("chosen");

  rows.push('<div class="dropdown '+(options.open?"open":"")+'" id="'+options.cssid+'">');
  rows.push('<a style="widt_h:124px" class="btn dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="#">'+
      label + '&nbsp;<b class="caret"></b> </a>');

  var cols=1;
  if (count>8) cols=2;
  if (count>16) cols=3;
  rows.push('<ul class="dropdown-menu" style="width:'+(240*cols)+'px">');
  //TODO: add for/ids to labels and checkboxes
  if (count>1) {
    rows.push('<li><a style="padding:0" href="#" id="allSelected" class="multicheck">');
    rows.push('<label style="margin:0;padding: 3px 20px 3px 20px;width:100%;height:100%;cursor:pointer;">');
    if (this.allSelected)
      rows.push('<input type="checkbox" style="margin-bottom:5px;" /> <i>'+_("select.all")+'</i></label></a>');
    else
      rows.push('<input type="checkbox" style="margin-bottom:5px;" checked/> <i>'+_("deselect.all")+'</i></label></a>');
    each(this.addFunctions, function(a,k) {
      rows.push('<li><a style="padding:0" href="#" id="addfunc_'+a+'" class="multicheck">');
      rows.push('<label style="margin:0;padding: 3px 20px 3px 20px;width:100%;height:100%;cursor:pointer;">');
      rows.push('<input type="checkbox" style="margin-bottom:5px;" '+k.checked+'/> <i>'+k.bezeichnung+'</i></label></a>');
    });

    rows.push('<li class="divider">');
  }
  if (this.data!=null) {
    each(churchcore_sortMasterData(this.data), function(k,a) {
      if (a.bezeichnung!='-') {
        rows.push('<li style="float:left;width:240px"> ');//+(this_object.isSelected(a.id)?'class="active"':'')+'>');
        rows.push('<a style="padding:0" href="#" id="'+a.id+'" class="multicheck">');
        rows.push('<label style="margin:0;padding: 3px 20px 3px 20px;width:100%;height:100%;cursor:pointer;">');
        rows.push('<input type="checkbox" style="margin-bottom:5px;" '+(this_object.isSelected(a.id)?'checked':'')+'/> ');
        rows.push(a.bezeichnung);
        rows.push('</label></a>');
      }
      else
        rows.push('<li style="float:left;width:'+(240*cols)+'px" class="divider">');
    });
  }
  rows.push('</ul>');
  rows.push('</div>');
  rows.push('</div>');
  rows.push('</div>');
  if (controlgroup) rows.push('</div></div>');

  $("#"+divid).html(rows.join(""));

  // Callback
  $('#'+divid+' a.multicheck').click(function(e) {
    var id = $(this).attr("id");
    if (id=="allSelected") {
      if (this_object.allSelected) {
        this_object.allSelected=false;
        this_object.selectAll();
      }
      else {
        this_object.selected=new Array();
        this_object.allSelected=true;
      }
      each(this_object.addFunctions, function(k,a) {
        a.checked="";
      });
      if (typeof this_object.func == "function")
        this_object.func(id, this_object.isSelected(id));
    }
    else if (id.indexOf("addfunc")==0) {
      each(this_object.addFunctions, function(k,a) {
        if (id=="addfunc_"+k) {
          if (a.checked=="checked") a.checked=""; else a.checked="checked";
          this_object.allSelected=true;
          each(this_object.data, function(i,b) {
            // Wenn sie nicht markiert sind, will ich sie markieren
            if (a.checked=="checked") {
              if ((a.func(b)) && (!churchcore_inArray(b.id, this_object.selected))) {
                this_object.selected.push(b.id);
                if (typeof this_object.func == "function")
                  this_object.func(b.id, true);
              }
            }
            else {
              // Wenn sie markiert sind, will ich sie de-markieren
              if (a.func(b)) {
                each(this_object.selected, function(i,c) {
                  if (c==b.id) {
                    this_object.selected.splice(i, 1);
                    return false;
                  }
                });
                if (typeof this_object.func == "function")
                  this_object.func(b.id, false);
              }
            }
          });
        }
      });
    }
    else {
      this_object.toggleSelected(id);
      if (churchcore_countObjectElements(this_object.data)==this_object.selected.length)
        this_object.allSelected=false;
      else
        this_object.allSelected=true;
      each(this_object.addFunctions, function(k,a) {
        a.checked="";
      });
      if (typeof this_object.func == "function")
        this_object.func(id, this_object.isSelected(id));
    }
    options.open=true;
    this_object.render2Div(divid, options);
    return false;
  });
};

CC_MultiSelect.prototype.getSelected = function () {
  return this.selected;
};

CC_MultiSelect.prototype.toggleSelected = function (id) {
  if (this.isSelected(id)) {
    var newSelected=new Array();
    each(this.selected, function(k,a) {
      if (a!=id) newSelected.push(a);
    });
    this.selected=newSelected;
  }
  else this.selected.push(id);
};

CC_MultiSelect.prototype.selectAll = function() {
  var t=this;
  t.selected=new Array();
  each(t.data, function(k,a) {
    if ((a!=null) && (a.bezeichnung!='-') && (a.notSelectable==null || !a.notSelectable))
      t.selected.push(a.id);
  });
};


/**
 * Setzt die Selected-Werte, Achtung, rendert nicht neu, dafÔøΩr muÔøΩ z.B. render2Div aufgerufen werden
 * @param arrayString  Array mit Idsm die selektiert werden sollen z.b. [1,3,5]
 */
CC_MultiSelect.prototype.setSelectedAsArrayString = function(arrayString) {
  var t=this;
  if ((arrayString!=null) && (arrayString!="")) {
    var a = arrayString.substr(1,arrayString.length-2);
    var selected = new Array();
    each(a.split(","), function(k,a) {
      if ((t.data!=null) && (t.data[a]!=null))
        selected.push(a);
    });
    this.selected = selected;
  }
};
CC_MultiSelect.prototype.getSelectedAsArrayString = function() {
  return "["+this.selected.join(",")+"]";
};

CC_MultiSelect.prototype.addFunction= function(name, func) {
  this.addFunctions.push({bezeichnung:name, func:func, checked:""});
};

CC_MultiSelect.prototype.isSomethingSelected = function() {
  return this.selected.length!=0;
};


/**
 * Gibt true zurÔøΩck (d.h. er soll es wegfiltern), wenn mind. einer selektiert ist und wenn es nicht die Id ist.
 * @param id
 */
CC_MultiSelect.prototype.filter = function(id) {
  if ((this.selected.length!=0) && (!this.isSelected(id))) return true;
  return false;
};

CC_MultiSelect.prototype.toString = function dogToString() {
  return this.getSelectedAsArrayString();
};

function CC_Menu(label) {
  this.label=label;
  this.entries=new Array();
}

CC_Menu.prototype.getLabel = function() {
  return this.label;
};

CC_Menu.prototype.addEntry = function(caption, id, icon) {
  var entry = new Object();
  entry.caption=caption;
  entry.id=id;
  entry.icon=icon;
  this.entries.push(entry);
};

CC_Menu.prototype.renderDiv = function(divId, asButton) {
  if (this.entries.length==0) return false;
  var rows = new Array();

  if ((asButton==null) || (asButton==false)) {
    rows.push('<div class="well sidebar-nav"><ul class="nav nav-list">');
    rows.push('<li class="nav-header">'+this.label);
    each(this.entries, function(k,a) {
      rows.push('<li><a href="#" id="'+a.id+'"><i class="icon-'+a.icon+'"></i> '+a.caption+'</a>');
    });
  }
  else {
    rows.push('<div class="btn-group">');
    rows.push('<button class="btn dropdown-toggle" data-toggle="dropdown">'+_("menu")+' <span class="caret"></span></button>');
    rows.push('<ul class="dropdown-menu">');
    each(this.entries, function(k,a) {
      rows.push('<li><a href="#" id="'+a.id+'"><i class="icon-'+a.icon+'"></i> '+a.caption+'</a>');
    });

  }
  rows.push('</ul></div>');
  jQuery("#"+divId).html(rows.join(""));
  return true;
};


var form_count=0;
/**
 *
 * @param label  ÔøΩberschrift
 * @param value_container = Value Object mit allen Daten. Wird fÔøΩr die Value der Fields genutzt, wenn kein Value angegeben wird.
 * @param cssid  cssid fÔøΩr die cssid des Forms und Prefix fÔøΩr Formularfelder, wenn dort keine cssid angegeben ist.
 */
function CC_Form(label, value_container, cssid) {
  this.rows=new Array();
  this.label=label;
  this.surroundDiv=null;
  this.help=null;
  this.fields=new Array();
  this.value_container=value_container;
  if (cssid!=null)
    this.cssid=cssid;
  else {
    this.cssid="form"+form_count;
    form_count=form_count+1;
  }
}

CC_Form.prototype.getLabel = function() {
  return this.label;
};

CC_Form.prototype.getCSSId = function() {
  return this.cssid;
};

CC_Form.prototype.setLabel = function(label) {
  this.label = label;
};

CC_Form.prototype.surroundWithDiv = function(divclass) {
  this.surroundDiv=divclass;
};

CC_Form.prototype.getVal = function(cssid) {
  var res=$("#"+this.cssid+" #"+cssid).val();
  if (res!=null)
    return res.trim();
  else return null;
};

/**
 * Holt den Wert von einer Checkbox 1=ja, 0=nein
 * @param cssid
 * @return 0 oder 1
 */
CC_Form.prototype.getChecked = function(cssid) {
  return ($("#"+this.cssid+" #"+cssid).attr("checked")=="checked"?1:0);
};

CC_Form.prototype.addStandardField = function(field, authArray) {
  var t=this;
  var value=null;
  if (t.value_container!=null) value=t.value_container[field.sql];
  var o = new Object();
  o.label=field.text;
  o.cssid=field.sql;
  if ((field.auth!=null) && (masterData.auth[field.auth]==null) && (authArray!=null) && (!churchcore_inArray(field.auth, authArray))) {
    o.disabled=true;
  }
  switch (field.type) {
    case "select":
      var data = null;
      if (field.selector.indexOf("code:")==0)
        data=this.standardFieldCoder(field.selector.substr(5,99), arr);
      else
        data=masterData[field.selector];
      o.selected=value;
      o.data=data;
      t.addSelect(o);
      break;
    case "date":
      if (value!=null)
        o.value=value.toDateEn(false).toStringDe(false);
      t.addDate(o);
      break;
    case "checkbox":
      o.checked=((value!=null) && (value==1));
      t.addCheckbox(o);
      break;
    case "textarea":
      o.maxlength=field.length;
      o.data=value;
      t.addTextarea(o);
      break;
    default:
      o.email=(field.sql=="email");
      o.value=value;
      o.maxlength=field.length;
      t.addInput(o);
      break;
  }
};

/**
 * Holt sich anhand der vorher ÔøΩbergebenen cssids die Daten innerhalb der FORM zusammen
 * @param withEmpty default:true, sollen auch Felder mit gefÔøΩllt werden, die leer sind.
 * @return object
 */
CC_Form.prototype.getAllValsAsObject = function(withEmpty) {
  var t = this;
  if (withEmpty==null) withEmpty=true;
  var o = new Object();
  each(this.fields, function(k,field) {
    if ((withEmpty) || (field.required) || (t.getVal(field.cssid)!="")) {
      if (field.fieldtype=="input")
        o[field.cssid]=t.getVal(field.cssid).trim();
      else if (field.fieldtype=="date") {
        if (t.getVal(field.cssid)!="")
          o[field.cssid]=t.getVal(field.cssid).trim().toDateDe(false).toStringEn(false);
        else o[field.cssid]="";
      }
      else if (field.fieldtype=="textarea")
        o[field.cssid]=t.getVal(field.cssid);
      else if (field.fieldtype=="checkbox")
        o[field.cssid]=t.getChecked(field.cssid);
      else if (field.fieldtype=="select")
        o[field.cssid]=t.getVal(field.cssid);
      else if (field.fieldtype=="hidden")
        o[field.cssid]=t.getVal(field.cssid);
      else alert("Bei getAllValsAsObject ist "+field.fieldtype+" nicht nicht implementiert");

      if ((field.required) && (o[field.cssid]=="")) {
        var elem=$("#"+t.cssid+" #"+field.cssid).parent(".controls");
        elem.append('<span class="help-inline error">Bitte das Feld ausf&uuml;llen!</span>');
        elem.parent(".control-group").addClass("error");
        o=null;
        return false;
      }
    }
  });
  return o;
};

CC_Form.prototype.addLink = function(caption, id, text, _class) {
  _text='<label class="button ">';
    _text="";
  if (caption!="") {
    _text=_text+'<label>'+caption+'</label>';
  }
  if (_class==null) _class="";
  _class=_class+" btn";
  _text=_text+"<a href=\"#\" id=\""+id+"\" class=\""+_class+"\"";
  _text=_text+">"+text+"</a>&nbsp;&nbsp;&nbsp;"
  this.rows.push(_text);
};

CC_Form.prototype.addSeparator = function() {
  this.rows.push("<br/>");
};

CC_Form.prototype.addImage = function(options) {
  this.rows.push(form_renderImage(options));
};

CC_Form.prototype.renderField = function(field) {
  if (debug) console.log(field);
  var success=true;
  if (field.fieldtype=="select")
    this.rows.push(form_renderSelect(field));
  else if ((field.fieldtype=="input") || (field.fieldtype=="date"))
    this.rows.push(form_renderInput(field));
  else if (field.fieldtype=="textarea")
    this.rows.push(form_renderTextarea(field));
  else if (field.fieldtype=="checkbox")
    this.rows.push(form_renderCheckbox(field));
  else if (field.fieldtype=="hidden")
    this.rows.push(form_renderHidden(field));
  else {
    alert("Fieldtype "+field.fieldtype+" nicht gefunden!");
    success=false;
  }
  // Nun noch der Liste hinzufÔøΩgen, damit es spÔøΩter ausgelesen werden kann
  if (success) this.fields.push(field);
};

CC_Form.prototype.addSelect = function(options) {
  this.renderField(
      this.prepareOptionsAsField(options, "select")
  );
};
CC_Form.prototype.addMultiSelect = function(options) {
  this.rows.push(form_renderMultiSelect(options));
};
CC_Form.prototype.addHidden = function(options) {
  this.renderField(
      this.prepareOptionsAsField(options, "hidden")
  );
};

CC_Form.prototype.addCaption = function(options) {
  this.rows.push(form_renderCaption(options));
}

CC_Form.prototype.addButton = function(options) {
  this.rows.push(form_renderButton(options));
};

CC_Form.prototype.addCheckbox = function(options) {
  this.renderField(
    this.prepareOptionsAsField(options, "checkbox")
  );
};

/**
 * Setzt die CSSID falls nicht vorhanden und addiert das Feld mit dem Typ fieldtype zur Liste
 * @param options
 * @param fieldtype
 * @return field
 */
CC_Form.prototype.prepareOptionsAsField = function(options, fieldtype) {
  var field=$.extend({},options);
  if (options.cssid==null) {
    if (options.label!=null)
      field.cssid=options.label.replace(" ","_");
    else if (options.name!=null)
      field.cssid=options.name.replace(" ","_");
  }
  if ((field.value==null) && (this.value_container!=null)) {
    if (fieldtype=="checkbox")
      field.checked=this.value_container[field.cssid]==1;
    else if (fieldtype=="select")
      field.selected=this.value_container[field.cssid];
    else if (fieldtype=="textarea")
      field.data=this.value_container[field.cssid];
    else
      field.value=this.value_container[field.cssid];
  }
  field.fieldtype=fieldtype;
  return field;
};

CC_Form.prototype.addInput = function (options) {
  this.renderField(
    this.prepareOptionsAsField(options, "input")
  );
};

CC_Form.prototype.addDate = function (options) {
  this.renderField(
    this.prepareOptionsAsField(options, "date")
  );
};

CC_Form.prototype.addTextarea = function (options) {
  this.renderField(
    this.prepareOptionsAsField(options, "textarea")
  );
};

CC_Form.prototype.addHtml =function(html) {
  if (html!=null) this.rows.push(html);
};

CC_Form.prototype.setHelp = function(title) {
  this.help=title;
};

/**
 *
 * @param border (true/false)
 * @param form_type null=vertical, horizontal, inline
 * @return html code
 */
CC_Form.prototype.render = function(border, form_type) {
  if (this.rows.length==0) return "";

  var rows = new Array();

  if (this.surroundDiv!=null)
    rows.push('<div class="'+this.surroundDiv+'">');

  if (this.label!=null)
    rows.push('<legend>'+this.label+'</legend>');


  rows.push('<form id="'+this.cssid+'" class="'+(border?"well":"")+' '+(form_type==null?"":"form-"+form_type)+'">');

  if (this.help!=null)
    rows.push('<p class="pull-right">'+form_renderHelpLink(this.help, true)+'</p>');

  rows.push(this.rows.join(""));

  rows.push("</form>");

  if (this.surroundDiv!=null) rows.push("</div>");

  return rows.join("");
};




function CC_Navi(name) {
  this.entries=new Array();
  this.search=null;
  this.name=name;
}

CC_Navi.prototype.addEntry = function(active, id, label) {
  var entry = new Array();
  entry.active=active;
  entry.id=id;
  entry.label=label;
  this.entries.push(entry);
};

CC_Navi.prototype.countElement = function() {
  return this.entries.length;
};

CC_Navi.prototype.addSearch = function(searchEntry) {
  if (churchcore_tabletformat())
    this.search='<input type="text" id="searchEntry" placeholder="'+_("search")+'" class="input-small search-query pull-right" value="'+searchEntry+'"/>';
  else
    this.search='<input type="text" id="searchEntry" placeholder="'+_("search")+'" class="input-medium search-query pull-right" value="'+searchEntry+'"/>';
};

CC_Navi.prototype.render = function(asButton) {
  var rows = new Array();

  if (!asButton) {
    rows.push('<ul class="nav nav-tabs '+(churchcore_handyformat()?"nav-stacked":"")+'">');
      each(this.entries, function(k,a) {
        rows.push('<li class="'+(a.active?"active":"")+'"><a href="#" id="'+a.id+'">'+a.label+'</a></li>');
      });
      if (this.search!=null) rows.push('<li class="pull-right">'+this.search);
    rows.push('</ul>');
  }
  else {
    if (this.entries.length>1) {
      var activename=this.name;
      each(this.entries, function(k,a) {
        if (a.active) activename=a.label;
      });
      rows.push('<span class="btn-group">');
      rows.push('<button class="btn dropdown-toggle" data-toggle="dropdown">'+activename+' <span class="caret"></span></button>');
      rows.push('<ul class="dropdown-menu">');
      each(this.entries, function(k,a) {
        rows.push('<li class="'+(a.active?"active":"")+'"><a href="#" id="'+a.id+'">'+a.label+'</a></li>');
      });
      rows.push("</ul></span>");
    }
    if (this.search!=null) rows.push(this.search);
    rows.push("<br/><br/>");
  }
  return rows.join("");
};

CC_Navi.prototype.renderDiv = function(divId, asButton) {
  jQuery("#"+divId).html(this.render(asButton));
};

CC_Navi.prototype.activate = function(id) {
  $("ul.nav li.active").removeClass("active");
  $("ul.nav a[id="+id+"]").parent().addClass("active");
};

/**
 *
 * @param title
 * @param text
 * @param width
 * @param height
 * @param buttons
 * @return jQuery-Element
 */
function form_showDialog (title, text, width, height, buttons) {
  var elem =$('<div id="cdb_dialog">'+text+"</div>").appendTo("#page");
  if (width>window.innerWidth) {
    width=window.innerWidth-16;
    if (width<300) width=300;
  }
  if (buttons==null) buttons=new Object();

  elem.dialog({
    autoOpen:true,
    width:width,
    height:height,
    modal:true,
    title:title,
    buttons:buttons,
    close: function() {
      elem.empty().remove();
      elem=null;
    }
  });
  // hack around the problem with editing link and image editor when a dialog already open
  elem.removeClass("ui-dialog-content");
  elem.addClass("ct-dialog-content");
  $("div.ui-dialog-buttonpane button").addClass("btn");

  return elem;
};

/**
 * Erstellt einen Dialog mit Abbruch-Button
 * @param title
 * @param text
 * @param width (optional, standard=350)
 * @param height (optional, standard=400)
 * @return jQuery Element
 */
function form_showCancelDialog (title, text, width, height) {
  if (width==null) width=350;
  if (height==null) height=400;
  var elem=form_showDialog(title, text, width, height);
  elem.dialog("addbutton", _("cancel"), function() {
    $(this).dialog("close");
  });
  return elem;
};


/**
 * Erstellt einen Dialog mit Abbruch-Button
 * @param title
 * @param text
 * @param width (optional, standard=350)
 * @param height (optional, standard=400)
 * @return jQuery Element
 */
function form_showOkDialog(title, text, width, height) {
  if (width==null) width=350;
  if (height==null) height=400;
  return form_showDialog(title, text, width, height, {
    "Ok": function() {
    $(this).dialog("close");
  }});
};

/**
 * Add the possibility to add buttons to the jQuery UI Dialog
 */
jQuery.extend(jQuery.ui.dialog.prototype, {
  'addbutton': function(buttonName, func) {
      var buttons = this.element.dialog('option', 'buttons');
      buttons[buttonName] = func;
      this.element.dialog('option', 'buttons', buttons);
      $("div.ui-dialog-buttonpane button").addClass("btn");
  }
});

/**
 * Add the possibility to add buttons to the jQuery UI Dialog
 */
jQuery.extend(jQuery.ui.dialog.prototype, {
  'addcancelbutton': function() {
      var t=this;
      var buttons = t.element.dialog('option', 'buttons');
      buttons[_("cancel")] = function() {
        t.element.dialog("close");
      };
      t.element.dialog('option', 'buttons', buttons);
      $("div.ui-dialog-buttonpane button").addClass("btn");
  }
});

/**
 * Add the possibility to add buttons to the jQuery UI Dialog
 */
jQuery.extend(jQuery.ui.dialog.prototype, {
  'addsaveandcancelbutton': function(func) {
      var t=this;
      var buttons = t.element.dialog('option', 'buttons');
      buttons[_("save")] = func;
      buttons[_("cancel")] = function() {
        t.element.dialog("close");
      };
      t.element.dialog('option', 'buttons', buttons);
      $("div.ui-dialog-buttonpane button").addClass("btn");
  }
});

/**
 *
 * @param arr vorhandenees array
 * @param id
 * @param bez
 * @param sortkey
 * @return erweitertes array
 */
function form_addEntryToSelectArray (arr, id, bez, sortkey, notSelectable) {
  var new_arr=new Object();
  new_arr["id"]=id;
  new_arr["bezeichnung"]=bez;
  if (sortkey!=null)
    new_arr["sortkey"]=sortkey;
  if (notSelectable!=null)
    new_arr["notSelectable"]=notSelectable;
  arr[id]=new_arr;
};
/*
* @param divid
* @param curDate aktuelles Datum
* @param func function fuer erfolgte Auswahl mit Arg func(dateText,divid)
*/
function form_implantDatePicker(divid, curDate, func, highlightDay) {
 if (typeof curDate== "string") curDate=curDate.toDateDe();
 if ($("#"+divid).html()=="") {
   $("#"+divid).datepicker({
     dateFormat: 'dd.mm.yy',
     showButtonPanel: true,
     dayNamesMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
     currentText: _("today"),
     firstDay: 1,
     monthNames:getMonthNames(),
     beforeShowDay: highlightDay,
     onSelect : function(dateText, inst) {
                  func(dateText, divid);
                  $("#"+divid).datepicker("destroy");
                  $("#"+divid).html("");
                }
   });
   $("#"+divid).datepicker($.datepicker.regional['de']);
   $("#"+divid).datepicker('setDate', curDate);
 }
 else {
   $("#"+divid).datepicker("destroy");
   $("#"+divid).html("");
 }
 shortcut.add("esc", function() {
   $("#"+divid).datepicker("destroy");
   $("#"+divid).html("");
 });
 var c = null;
 $("#"+divid).mouseenter(function() {
   if (c!=null) window.clearTimeout(c);
  })
 $("#"+divid).mouseleave(function() {
   c = window.setTimeout(function() {
     $("#"+divid).datepicker("destroy");
     $("#"+divid).html("");
     c = null;
   }, 400);
  })
};

function form_renderHelpLink(link, invert) {
  if ((invert==null) || (invert==false))
    return '<a href="/?q=help&doc='+link+'" target="_clean"><i class="icon-question-sign"></i></a>';
  else
    return '<a href="/?q=help&doc='+link+'" target="_clean"><i class="icon-question-sign icon-white"></i></a>';
}


$.widget("ct.popupmenu", {
  options: {
    entries: ["Abbruch"],
    pos: {clientX: 10, clientY: 10 },
    click: function(id) {},
    remove: function(id) {}
  },

  _create: function() {
  },

  show: function() {
    var t = this;
    var rows = new Array();
    rows.push('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">');
    each(t.options.entries, function(k,a) {
      rows.push('<li><a href="#" class="options" data-id="'+k+'">' + a + '</a></li>');
    });
    rows.push('</ul>');
    this.element.html('<div id="mypop" style="z-index:10000;position:absolute;">'+rows.join("")+'</div>');
    this.element.data("popupmenu", true);
    this.element.offset({ top: t.options.pos.clientY, left: t.options.pos.clientX});
    this.element.find("ul.dropdown-menu").css("display", "inline");
    shortcut.add("esc", function() {
      t.hide();
    });
    this.element.find("a.options").click(function() {
      t.options.click($(this).attr("data-id"));
      t.hide();
      return false;
    });
  },

  hide: function() {
    this.options.remove();
    this.element.html("");
    this.element.data("popupmenu", null);
  }
});



$.widget("ct.colorcheckbox", {
  options: {
    color: "blue",
    textColor: "white",
    checked : false,
    id : null,
    name : "unnamed",
    label : null,
    change: function(newVal) {},
    rerenderEditor: function(txt, data) {return txt; },
    afterRender: function(data) {},
    render: function(txt, data) {return txt; },
    validate: function(txt, data) {return true; }
  },

  _create: function() {
    var t = this;
    t._renderCheckbox();
  },

  _renderCheckbox : function() {
    var t = this;
    var rows = new Array();
    rows.push(form_renderColorCheckbox(t.options.color, t.options.textColor, t.options.checked)+"&nbsp; ");

    if (t.options.label!=null) {
      rows.push(t.options.label);
    }
    this.element.html('<span class="icon clickable">'+rows.join("")+'</span>');
    this.element.find(".icon").click(function() {
      t.options.checked=!t.options.checked;
      t.options.change(t.options.checked, t.options.id, t.options.name);
      t._renderCheckbox();
    });
  },
  check : function(check) {
    var t = this;
    if (t.options.checked != check) {
      t.options.checked = check;
      t.options.change(t.options.checked, t.options.id, t.options.name);
      t._renderCheckbox();
    }
  }
});


/**
 * options:
 *   create()
 *   success()
 *   cancel()
 */
$.widget("ct.editable", {

  options: {
    value:null,
    data:null,
    type:"input",
    autosaveSeconds:0,
    renderEditor: function(txt, data) {return txt; },
    rerenderEditor: function(txt, data) {return txt; },
    afterRender: function(data) {},
    render: function(txt, data) {return txt; },
    validate: function(txt, data) {return true; }
  },

  _autosave:null,

  _create: function() {
    var t=this;
    if (t.options.value==null) t.options.value="";
    t._renderField();
    this.element.click(function() {
      t._startEditor();
    });
    this.element.hover(function() {
        $(this).addClass("active");
      },
      function() {
        $(this).removeClass("active");
      }
    );
  },

  success: function() {
    this._clearTimer();
    var newval=this.options.rerenderEditor(this.element.find(this.options.type).val(), this.options.data);
    if (this.options.validate(newval, this.options.data)) {
      this.options.value=newval;
      this.options.success(this.options.value, this.options.data);
      this.element.removeClass("editmode");
      this._renderField();
    }
  },

  cancel: function() {
    this._clearTimer();
    this.element.removeClass("editmode");
    this._renderField();
  },

  _clearTimer: function() {
    if (this._autosave!=null)
      window.clearTimeout(this._autosave);
    this._autosave=null;
  },

  _renderField: function() {
    this.element.html(this.options.render(this.options.value, this.options.data));
    this.options.afterRender(this.element, this.options.data);
  },

  _renderEditor: function() {
    return this.options.renderEditor(this.options.value, this.options.data);
  },

  _startEditor: function() {
    var t=this;
    editable=this.element;
    // Check if this class has not already started the edit mode
    if (!editable.hasClass("editmode")) {
      // Take off editor, when there are there is an old editable
      $(".editmode").each(function(k,a) {
        $(a).editable("success");
      });
      editable.addClass("editmode");
      var elem=null;
      if (t.options.type=="textarea") {
        var rows=new Array();
        rows.push('<div>');
        var height=(editable.height()+10);
        if (height<40) height=40;
        var width=(editable.width()-10);
        if (width<123) width=123;
        rows.push('<textarea class="editor" maxlength="200" style="margin:0;width:'+width+'px;height:'+height+'px" '
            +'>'+t._renderEditor()+'</textarea>');
        rows.push('<br/><span class="" style="position:absolute;z-index:1000">');
        rows.push(form_renderButton({type:"small", htmlclass:"save btn-primary", label:_("save")}));
        rows.push(form_renderButton({type:"small", htmlclass:"cancel ", label:_("cancel")}));
        rows.push('</span>');
        rows.push('</div>');
        var elem=editable.html(rows.join("")).find(t.options.type);

        // Limit max character to given maxlength
        elem.keyup(function(){
          var max = parseInt($(this).attr('maxlength'));
          if($(this).val().length > max){
             $(this).val($(this).val().substr(0, max));
          }
          $(this).parent().find('.charleft').html(max - $(this).val().length);
       });
      }
      // Type=input
      else {
        elem=editable.html('<input type="text" class="editor" style="margin:0;width:'+(editable.width()-10)+'px" '
             +'value="'+t._renderEditor()+'"/>')
           .find(t.options.type);
      }
      elem.focus();
      // Not by textarea, otherweise Firefox selected after editing the normal text...
      if (t.options.type!="textarea") elem.select();
      editable.find(".save").click(function() {
        t.success();
        return false;
      });
      editable.find(".cancel").click(function() {
        t.cancel();
        return false;
      });
      elem.keyup(function(e) {
        if (t.options.autosaveSeconds>0) {
          if (t._autosave!=null)
            window.clearTimeout(t._autosave);
          t._autosave=window.setTimeout(function() { t.success(); }, t.options.autosaveSeconds*1000);
        }

        // Enter
        if (e.keyCode == 13) {
          if (t.options.type!="textarea")
            t.success();
        }
        // Escape
        else if (e.keyCode == 27) {
          t.cancel();
        }
      });
     }
   }

});

var currentTooltip=null;

function clearTooltip(force) {
  if (currentTooltip!=null) {
    currentTooltip.tooltips("hide", force);
  }
}

$.widget("ct.tooltips", {

  options: {
    data:null,
    auto:true,
    showontouchscreen:true,
    placement:"bottom",
    container:null,
    render:function(data) {return ["content","title"];},
    afterRender:function(element, data) {},
    getTitle:function(data) {return null;}
  },

  _showTimer:null,
  _hideTimer:null,
  _visible:false,

  _create:function() {
    var t=this;
    t.element.addClass("tooltips-active");
    if (t.options.auto && (t.options.showontouchscreen || !churchcore_touchscreen())) {
      this.element.hover(
        function() {
          t._startShowTimer();
        },
        function() {
          t._startRemoveTimer();
        }
      );
    }
  },

  /**
   *  public function to immediate or slow hide the tooltip
   */
  hide: function(immediate) {
    var t=this;
    if (immediate==null || immediate) {
      t._clearHideTimer();
      t._clearShowTimer();
      t._hideTooltip();
    }
    else {
      t._startRemoveTimer();
    }
  },
  show: function() {
    this._startShowTimer();
  },

  /*
   * Refresh content of tooltip without hide and show it again
   */
  refresh: function() {
    var t=this;
    var content=t.options.render(this.options.data);
    if (content instanceof(Array)) {
      $("div.popover-content").html(content[0]);
      $("div.popover-title").html(content[1]);
    }
    else
      $("div.popover-content").html(content);
    t.options.afterRender(t.element.next(".popover"), this.options.data);
  },

  _clearHideTimer: function() {
    if (this._hideTimer!=null) {
      window.clearTimeout(this._hideTimer);
      this._hideTimer=null;
    }
  },
  _clearShowTimer: function() {
    if (this._showTimer!=null) {
      window.clearTimeout(this._showTimer);
      this._showTimer=null;
    }
  },

  _hideTooltip: function() {
    if (this._visible) {
      this._visible=false;
      this.element.removeClass("tooltips-active");
      this.element.popover("hide");
      this.element.data("popover", null);
    }
    if (currentTooltip!=null && currentTooltip==this.element)
      currentTooltip=null;
  },


  _showTooltip: function() {
    var t=this;
    var content=t.options.render(this.options.data);
    if (content==null) {
      t._hideTooltip();
      return;
    }
    t._visible=true;

    var o = {
        html:true,
        placement:t.options.placement, trigger:"manual", animation:true};

    if (content instanceof(Array)) {
      o.title = content[1];
      o.content = content[0];
    }
    else
      o.content = content[0];
    if (t.options.container) o.container=t.options.container;
    t.element.popover(o).popover("show");

    // Add additional Hover becaus container ist not t.element.
    if (t.options.container!=null) {
      $("div.popover").hover(function() {
        if (t._hideTimer!=null) t._clearHideTimer();
        return false;
      },
      function() {
        t._startRemoveTimer();
        return false;
      });
    }
    t.options.afterRender(t.element.next(".popover"), this.options.data);
  },


  _startShowTimer: function() {
    var d= new Date();
    var t=this;
    currentTooltip=t.element;
    t._clearHideTimer();
    if (t._showTimer==null && !t._visible) {
      t._showTimer=window.setTimeout(function() {
        t._showTooltip();
        t.element.next(".popover").hover(
          function() {
            if (t._hideTimer!=null) t._clearHideTimer();
          },
          function() {
            t._startRemoveTimer();
        });
        t._showTimer=null;
      }, 200);
    }
  },

  _startRemoveTimer: function() {
    var t=this;

    // When showTimer is running, cancel immediate!
    if (t._showTimer!=null) {
      t._clearShowTimer();
      t._hideTooltip();
    }
    else {
      if (t._hideTimer==null) {
        t._hideTimer=window.setTimeout(function() {
          t._hideTooltip();
          t._hideTimer=null;
        },200);
      }
    }
  }

});


/**
 * Drafter is an object to organize draft saving in local browser
 * id = identifier for this draft, like "wiki" or "email"
 * obj
 *  setContent function()
 *  getContent function()
 *  setStatus function()
 *  interval (default=10000)
 */
function Drafter(id, obj) {
  this.timer = null;
  this.obj = obj;
  this.obj.id=id;
  if (this.obj.interval==null) this.obj.interval=5000;

  var content_saves=churchcore_retrieveObject(settings.user.id+"/"+this.obj.id);
  if (content_saves!=null && content_saves!="") {
    var content_now=obj.getContent();
    if (content_now!=content_saves
        && confirm("Ich habe noch einen offenen Text gefunden, soll ich diesen wiederherstellen?")) {
      this.obj.setContent(content_saves);
      this.obj.setStatus("Daten wiederhergestellt.");
      churchcore_storeObject(settings.user.id+"/"+this.obj.id, null);
    }
    else this.clear();
  }
  this.activateTimer();
}

Drafter.prototype.activateTimer = function() {
  var t=this;
  if (this.timer!=null) window.clearTimeout(this.timer);
  t.timer=window.setTimeout(function() {
    var content=t.obj.getContent();
    if (content!="") t.obj.setStatus(_("save.data"));
    else t.obj.setStatus("");
    churchcore_storeObject(settings.user.id+"/"+t.obj.id, content);
    if (content!="") t.obj.setStatus(_("saved"));
    t.timer=null;
    t.activateTimer();
  }, t.obj.interval);
};

/**
 * Deactivate timer and delete draft
 */
Drafter.prototype.clear = function() {
  if (this.timer!=null) window.clearTimeout(this.timer);
  churchcore_storeObject(settings.user.id+"/"+this.obj.id, null);
};



/**
 * Abonement model
 * @param domain_type
 * @param domain_id
 */
function form_editNotification (domain_type, domain_id) {
  var form = new CC_Form();
  var value=null;
  if (domain_id!=null && getNotification(domain_type, domain_id)!==false)
    value=getNotification(domain_type, domain_id);

  if (domain_id!=null && value==null) {
    form.addHtml('<legend>Neues Email-Abo f&uuml;r '+masterData[domain_type][domain_id].bezeichnung+'</legend>');

    each(masterData.notificationtype, function(k,a) {
      a.sortkey=a.delay_hours;
    });

    form.addSelect({label:"Wann soll bei Neuigkeiten f&uuml;r <b>"+masterData[domain_type][domain_id].bezeichnung+"</b> benachrichtigt werden?",
           data:masterData.notificationtype, type:"medium", controlgroup:false, htmlclass:"new-notificationtype", selected:value, freeoption:true});
    form.addHtml('<p><p>');
  }

  if (masterData.notification[domain_type]!=null) {
    form.addHtml('<legend>Vorhandene Email-Abos</legend>');
    form.addHtml('<table class="table table-condensed"><tr><th style="min-width:60px">Abo<th style="min-width:60px">Notiz<th>Wie oft?<th width="22px">');
    each(masterData.notification[domain_type], function(k,a) {
      var txt = domain_type + " : "+ k;
      if (masterData[domain_type][k]!=null) txt = masterData[domain_type][k].bezeichnung;
      form.addHtml('<tr data-id="'+k+'"><td>'+_(domain_type)+": "+txt+'<td>');
      if (masterData[domain_type][k]!=null && masterData[domain_type][k].notiz!=null)
        form.addHtml('<small>'+masterData[domain_type][k].notiz+'</small>');
      form.addHtml('<td>');
      form.addSelect({data:masterData.notificationtype, type:"medium", htmlclass:"edit-notificationtype",
        selected:a.notificationtype_id, controlgroup:false});
      form.addHtml('<td>');
      form.addImage({src:"trashbox.png", width:20, htmlclass:"delete-notification", link:true});
    });
  }

  var elem=form_showDialog("Abonnement bearbeiten",form.render(null, "vertical"), 500,500, {
    "Schliessen": function() {
      $(this).dialog("close");
    }
  });

  elem.find('select.new-notificationtype').change(function() {
    if ($(this).val()!="") {
      var notificationtype_id=$(this).val();
      if (masterData.notification[domain_type]==null)
        masterData.notification[domain_type]=new Object();
      masterData.notification[domain_type][domain_id]={notificationtype_id:notificationtype_id, lastsenddate:null};
      elem.dialog("close");
      form_editNotification(domain_type, domain_id);
      churchInterface.jsendWrite({func:"editNotification", domain_type:domain_type, domain_id:domain_id,
           notificationtype_id:notificationtype_id}, function(ok, data) {
        if (!ok) alert("Fehler aufgetreten: "+data);
      });
    }
  });
  elem.find('select.edit-notificationtype').change(function() {
    if ($(this).val()!="") {
      var notificationtype_id=$(this).val();
      var domain_id=$(this).parents("tr").attr("data-id");
      masterData.notification[domain_type][domain_id]={notificationtype_id:notificationtype_id, lastsenddate:null};
      elem.dialog("close");
      form_editNotification(domain_type);
      churchInterface.jsendWrite({func:"editNotification", domain_type:domain_type, domain_id:domain_id,
        notificationtype_id:notificationtype_id}, function(ok, data) {
        if (!ok) alert("Fehler aufgetreten: "+data);
      });
    }
  });
  elem.find('a.delete-notification').click(function() {
    var domain_id=$(this).parents("tr").attr("data-id");
    delete masterData.notification[domain_type][domain_id];
    elem.dialog("close");
    form_editNotification(domain_type);
    churchInterface.jsendWrite({func:"editNotification", domain_type:domain_type, domain_id:domain_id}, function(ok, data) {
      if (!ok) alert("Fehler aufgetreten: "+data);
    });
    return false;
  });
};
