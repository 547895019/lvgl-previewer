/**
 * @file round_button_gen.c
 * @brief Template source file for LVGL objects
 */

/*********************
 *      INCLUDES
 *********************/

#include "round_button_gen.h"
#include "../ui_data_binding.h"

/*********************
 *      DEFINES
 *********************/

#define SIZE 36

/**********************
 *      TYPEDEFS
 **********************/

/***********************
 *  STATIC VARIABLES
 **********************/

/***********************
 *  STATIC PROTOTYPES
 **********************/

/**********************
 *   GLOBAL FUNCTIONS
 **********************/

lv_obj_t * round_button_create(lv_obj_t * parent, const char * text, lv_subject_t * subject, int32_t step)
{
    LV_TRACE_OBJ_CREATE("begin");

    lv_obj_t * lv_button_0 = lv_button_create(parent);
    lv_obj_set_name_static(lv_button_0, "round_button_#");
    lv_obj_set_width(lv_button_0, SIZE);
    lv_obj_set_height(lv_button_0, SIZE);
    lv_obj_set_style_radius(lv_button_0, SIZE, 0);
    lv_obj_set_ext_click_area(lv_button_0, 8);

    lv_obj_t * lv_label_0 = lv_label_create(lv_button_0);
    lv_label_set_text(lv_label_0, text);
    lv_obj_set_align(lv_label_0, LV_ALIGN_CENTER);
    
    lv_subject_increment_dsc_t * subject_increment_event_0 = lv_obj_add_subject_increment_event(lv_button_0, subject, LV_EVENT_PRESSED, step);
    lv_subject_increment_dsc_t * subject_increment_event_1 = lv_obj_add_subject_increment_event(lv_button_0, subject, LV_EVENT_LONG_PRESSED_REPEAT, step);

    LV_TRACE_OBJ_CREATE("finished");

    return lv_button_0;
}

/**********************
 *   STATIC FUNCTIONS
 **********************/

